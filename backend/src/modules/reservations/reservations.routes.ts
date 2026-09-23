import { Router } from "express";
import { prisma } from "../../utils/prisma";
import { authenticate } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { asyncHandler, ApiError } from "../../middleware/errors";
import { createReservationSchema, updateReservationSchema } from "./reservations.schemas";
import { archiveReservation, assertRoomAvailable, closeReservation, withComputed } from "./reservations.service";
import { buildInvitationLink } from "./invitation-link";

const router = Router();
router.use(authenticate);

const includeRelations = {
  client: true,
  salle: true,
  invites: true,
  servicesTables: true
};

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { statut, clientId, salleId } = req.query as Record<string, string | undefined>;
    const reservations = await prisma.reservation.findMany({
      where: {
        statut: statut as any,
        clientId,
        salleId
      },
      include: includeRelations,
      orderBy: { dateDebut: "desc" }
    });
    res.json(reservations.map(withComputed));
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const reservation = await prisma.reservation.findUnique({
      where: { id: req.params.id },
      include: { ...includeRelations, accesInvites: true, confiscations: true }
    });
    if (!reservation) throw ApiError.notFound("Reservation not found");
    res.json({ ...withComputed(reservation), invitationLink: buildInvitationLink(reservation) });
  })
);

router.post(
  "/",
  validateBody(createReservationSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as any;
    if (data.salleId) {
      await assertRoomAvailable({ salleId: data.salleId, dateDebut: data.dateDebut, dateFin: data.dateFin });
    }
    const reservation = await prisma.reservation.create({
      data: { ...data, utilisateurId: req.user!.id },
      include: includeRelations
    });
    res.status(201).json(withComputed(reservation));
  })
);

router.patch(
  "/:id",
  validateBody(updateReservationSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.reservation.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound("Reservation not found");

    const data = req.body as any;
    const nextSalleId = data.salleId ?? existing.salleId;
    const nextDebut = data.dateDebut ?? existing.dateDebut;
    const nextFin = data.dateFin ?? existing.dateFin;
    if (nextSalleId) {
      await assertRoomAvailable({
        salleId: nextSalleId,
        dateDebut: nextDebut,
        dateFin: nextFin,
        excludeReservationId: existing.id
      });
    }

    const reservation = await prisma.reservation.update({
      where: { id: req.params.id },
      data,
      include: includeRelations
    });
    res.json(withComputed(reservation));
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.reservation.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

/** "Clôturer" action. */
router.post(
  "/:id/close",
  asyncHandler(async (req, res) => {
    const reservation = await closeReservation(req.params.id);
    res.json(withComputed(reservation));
  })
);

/** "Archiv" / "Archiver et supprimer" actions. */
router.post(
  "/:id/archive",
  asyncHandler(async (req, res) => {
    const alsoDelete = req.query.alsoDelete === "true";
    const archive = await archiveReservation(req.params.id, alsoDelete);
    res.status(201).json(archive);
  })
);

export default router;
