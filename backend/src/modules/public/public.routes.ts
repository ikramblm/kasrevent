import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { validateBody } from "../../middleware/validate";
import { asyncHandler, ApiError } from "../../middleware/errors";
import rateLimit from "express-rate-limit";

const router = Router();
const publicLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });
router.use(publicLimiter);

/**
 * Replaces the original app's public Google Form intake (`Demande de Reservation`) —
 * anyone with the link can request a booking; staff later convert it via
 * POST /demandes-reservation/:id/reserver.
 */
const demandeSchema = z.object({
  nomPrenom: z.string().min(1),
  dateDebut: z.coerce.date().optional(),
  dateFin: z.coerce.date().optional(),
  typeEvenement: z.string().optional(),
  nombreInvites: z.number().int().nonnegative().optional(),
  numeroTelephone: z.string().min(1)
});

router.post(
  "/demande-reservation",
  validateBody(demandeSchema),
  asyncHandler(async (req, res) => {
    const demande = await prisma.demandeReservation.create({ data: req.body });
    res.status(201).json({ id: demande.id });
  })
);

/**
 * Replaces the second Google Form (`Reponses invitations`), reached via
 * `Réservations.Lien D'invitation` / this app's `/rsvp/:reservationId` page.
 */
const rsvpSchema = z.object({
  nomPrenom: z.string().min(1),
  numeroTelephone: z.string().optional()
});

router.post(
  "/rsvp/:reservationId",
  validateBody(rsvpSchema),
  asyncHandler(async (req, res) => {
    const reservation = await prisma.reservation.findUnique({ where: { id: req.params.reservationId } });
    if (!reservation) throw ApiError.notFound("Reservation not found");
    const reponse = await prisma.reponseInvitation.create({
      data: { ...req.body, reservationId: reservation.id }
    });
    res.status(201).json({ id: reponse.id });
  })
);

export default router;
