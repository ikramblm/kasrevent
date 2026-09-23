import { Router } from "express";
import { prisma } from "../../utils/prisma";
import { authenticate } from "../../middleware/auth";
import { asyncHandler, ApiError } from "../../middleware/errors";
import { assertRoomAvailable } from "../reservations/reservations.service";

const router = Router();
router.use(authenticate);

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const demandes = await prisma.demandeReservation.findMany({ orderBy: { createdAt: "desc" } });
    res.json(demandes);
  })
);

/**
 * Reproduces the "Enregistrer Client" action: `LINKTOFORM("Clients_Form", ...)` pre-filled
 * from the intake row. Here it directly creates the Client record.
 */
router.post(
  "/:id/enregistrer-client",
  asyncHandler(async (req, res) => {
    const demande = await prisma.demandeReservation.findUnique({ where: { id: req.params.id } });
    if (!demande) throw ApiError.notFound("Demande not found");
    const [nom, ...rest] = demande.nomPrenom.split(" ");
    const client = await prisma.client.create({
      data: { nom: nom || demande.nomPrenom, prenom: rest.join(" ") || undefined, telephone: demande.numeroTelephone }
    });
    res.status(201).json(client);
  })
);

/**
 * Reproduces the "Réserver" action: `LINKTOFORM("Réservations_Form", ...)` pre-filled from
 * the intake row. Here it directly creates the Reservation (still subject to the same
 * double-booking check as a normal booking).
 */
router.post(
  "/:id/reserver",
  asyncHandler(async (req, res) => {
    const demande = await prisma.demandeReservation.findUnique({ where: { id: req.params.id } });
    if (!demande) throw ApiError.notFound("Demande not found");
    const { clientId, salleId } = req.body as { clientId: string; salleId?: string };
    if (!demande.dateDebut || !demande.dateFin) {
      throw ApiError.badRequest("Demande is missing dateDebut/dateFin");
    }

    if (salleId) {
      await assertRoomAvailable({ salleId, dateDebut: demande.dateDebut, dateFin: demande.dateFin });
    }

    const reservation = await prisma.reservation.create({
      data: {
        clientId,
        salleId,
        dateDebut: demande.dateDebut,
        dateFin: demande.dateFin,
        nombreInvites: demande.nombreInvites ?? 0,
        utilisateurId: req.user!.id
      }
    });

    await prisma.demandeReservation.update({ where: { id: demande.id }, data: { reservationId: reservation.id } });
    res.status(201).json(reservation);
  })
);

export default router;
