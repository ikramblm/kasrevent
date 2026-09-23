import { prisma } from "../../utils/prisma";
import { ApiError } from "../../middleware/errors";
import type { Prisma } from "@prisma/client";

/**
 * Reproduces `Réservations.ID_Salle`'s Valid_If formula:
 *   =NOT(ISNOTBLANK(SELECT(Réservations[ID_Réservation], AND(
 *       [ID_Salle]=[_THISROW].[ID_Salle],
 *       [_THISROW].[Date Début]<=[Date Fin], [_THISROW].[Date Fin]>=[Date Début],
 *       [ID_Réservation]<>[_THISROW].[ID_Réservation] ))))
 * i.e. block the save if another (non-cancelled) reservation for the same room overlaps
 * the requested date range. This is the single most important invariant in the app —
 * enforced here on the server (the source app only enforced it client-side at save time).
 */
export async function assertRoomAvailable(params: {
  salleId: string;
  dateDebut: Date;
  dateFin: Date;
  excludeReservationId?: string;
}) {
  const { salleId, dateDebut, dateFin, excludeReservationId } = params;
  if (dateFin < dateDebut) {
    throw ApiError.badRequest("Date Fin must be on or after Date Début");
  }

  const conflict = await prisma.reservation.findFirst({
    where: {
      salleId,
      id: excludeReservationId ? { not: excludeReservationId } : undefined,
      statut: { not: "ANNULEE" },
      dateDebut: { lte: dateFin },
      dateFin: { gte: dateDebut }
    },
    include: { client: true }
  });

  if (conflict) {
    throw ApiError.conflict("Cette salle est déjà réservée pour cette période", {
      conflictingReservationId: conflict.id,
      conflictingClient: conflict.client.nom
    });
  }
}

export function withComputed<T extends { totalAPayer: Prisma.Decimal | number; avanceVersee: Prisma.Decimal | number }>(
  reservation: T
) {
  const total = Number(reservation.totalAPayer);
  const avance = Number(reservation.avanceVersee);
  return { ...reservation, resteAPayer: Math.max(total - avance, 0) };
}

/**
 * Reproduces the "Clôturer" action: SET Statut="Clôturé", Reste a Payer=0,
 * Avance Versée=Total a Payer — only allowed once `Date Début <= TODAY()`.
 */
export async function closeReservation(id: string) {
  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation) throw ApiError.notFound("Reservation not found");
  if (reservation.dateDebut > new Date()) {
    throw ApiError.badRequest("Cannot close a reservation before its start date");
  }
  return prisma.reservation.update({
    where: { id },
    data: { statut: "CLOTURE", avanceVersee: reservation.totalAPayer }
  });
}

/**
 * Reproduces the "Archiv" action (ADD_RECORD_TO Archives de reservations), only allowed
 * when Statut is Clôturé or Annulée, then optionally the "Archiver et supprimer" composite
 * (Archiv + Delete) via `alsoDelete`.
 */
export async function archiveReservation(id: string, alsoDelete: boolean) {
  const reservation = await prisma.reservation.findUnique({ where: { id }, include: { client: true, salle: true } });
  if (!reservation) throw ApiError.notFound("Reservation not found");
  if (!["CLOTURE", "ANNULEE"].includes(reservation.statut)) {
    throw ApiError.badRequest("Only a Clôturé or Annulée reservation can be archived");
  }

  const total = Number(reservation.totalAPayer);
  const avance = Number(reservation.avanceVersee);

  const archive = await prisma.archiveReservation.create({
    data: {
      reservationId: reservation.id,
      clientNom: reservation.client.nom,
      dateDebut: reservation.dateDebut,
      dateFin: reservation.dateFin,
      typeEvenement: reservation.typeEvenement,
      nombreInvites: reservation.nombreInvites,
      statut: reservation.statut,
      salleNom: reservation.salle?.nom,
      totalAPayer: reservation.totalAPayer,
      avanceVersee: reservation.avanceVersee,
      resteAPayer: Math.max(total - avance, 0),
      note: reservation.note,
      utilisateurId: reservation.utilisateurId
    }
  });

  if (alsoDelete) {
    await prisma.reservation.delete({ where: { id } });
  }

  return archive;
}
