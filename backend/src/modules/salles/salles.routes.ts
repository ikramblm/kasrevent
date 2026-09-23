import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { crudRouter } from "../../utils/crudFactory";
import { authenticate } from "../../middleware/auth";
import { asyncHandler, ApiError } from "../../middleware/errors";
import { validateQuery } from "../../middleware/validate";
import { Router } from "express";

const createSchema = z.object({
  nom: z.string().min(1),
  localisation: z.string().optional(),
  lienLocalisation: z.string().url().optional(),
  capacite: z.number().int().positive().optional(),
  tarif: z.number().nonnegative().optional(),
  equipementsInclus: z.array(z.string()).optional(),
  photo: z.string().optional(),
  utilisateurId: z.string().uuid().optional()
});

const updateSchema = createSchema.partial();

const router = crudRouter(prisma.salle, {
  createSchema,
  updateSchema,
  orderBy: { nom: "asc" }
}) as Router;

const availabilityQuerySchema = z.object({
  dateDebut: z.coerce.date(),
  dateFin: z.coerce.date(),
  excludeReservationId: z.string().uuid().optional()
});

/**
 * Reproduces `Salles.Disponibilité` / `Réservations.ID_Salle`'s Valid_If double-booking
 * check as a real endpoint the booking form calls before submit, in addition to the
 * server-side re-check performed in reservations.service.ts on create/update.
 */
router.get(
  "/:id/availability",
  authenticate,
  validateQuery(availabilityQuerySchema),
  asyncHandler(async (req, res) => {
    const { dateDebut, dateFin, excludeReservationId } = req.query as unknown as z.infer<typeof availabilityQuerySchema>;
    const salle = await prisma.salle.findUnique({ where: { id: req.params.id } });
    if (!salle) throw ApiError.notFound("Salle not found");

    const overlapping = await prisma.reservation.findFirst({
      where: {
        salleId: req.params.id,
        id: excludeReservationId ? { not: excludeReservationId } : undefined,
        statut: { notIn: ["ANNULEE"] },
        dateDebut: { lte: dateFin },
        dateFin: { gte: dateDebut }
      }
    });

    res.json({ available: !overlapping, conflictingReservationId: overlapping?.id ?? null });
  })
);

export default router;
