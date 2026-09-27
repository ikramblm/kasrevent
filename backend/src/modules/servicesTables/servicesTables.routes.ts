import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { authenticate } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { asyncHandler, ApiError } from "../../middleware/errors";

const router = Router();
router.use(authenticate);

const createSchema = z.object({
  reservationId: z.string().min(1),
  typeService: z.enum(["AUCUN_SERVICE", "BUFFET", "SERVICE_A_TABLE"]).default("AUCUN_SERVICE"),
  traiteurId: z.string().min(1).optional(),
  menuPropose: z.string().optional(),
  prixParPersonne: z.number().nonnegative().default(0),
  nombreInvites: z.number().int().nonnegative().optional(),
  employeIds: z.array(z.string().min(1)).default([])
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { reservationId } = req.query as { reservationId?: string };
    const items = await prisma.serviceTable.findMany({
      where: { businessId: req.user!.businessId, reservationId },
      orderBy: { date: "desc" }
    });
    res.json(items);
  })
);

/**
 * Reproduces, in one transaction:
 *  - `Services de Tables.Total` = Prix Par Personne * Nombre d'invités (initial value formula)
 *  - Action "Ajouter Total service a reservation": Réservations.Total a Payer += Total
 *  - Actions "ajout de dette 2" / Bot "Ajouter dettes Traiteur": Traiteurs.Dettes Traiteur += Total
 *  - Action "Ajouter Paie Par jour" (via "ajouter la paie par jour ... Action - 1"): every
 *    assigned employee whose `typePaie` is Journalière gets `paieParJour` added to their
 *    `montantAPayer`.
 */
router.post(
  "/",
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof createSchema>;
    const businessId = req.user!.businessId!;
    const reservation = await prisma.reservation.findUnique({ where: { id: input.reservationId } });
    if (!reservation || reservation.businessId !== businessId) throw ApiError.notFound("Reservation not found");
    if (input.traiteurId) {
      const traiteur = await prisma.traiteur.findUnique({ where: { id: input.traiteurId } });
      if (!traiteur || traiteur.businessId !== businessId) throw ApiError.badRequest("Invalid traiteurId");
    }

    const nombreInvites = input.nombreInvites ?? reservation.nombreInvites;
    const total = input.prixParPersonne * nombreInvites;

    // Scoped by businessId too — otherwise a crafted employeIds list could reach into
    // another business's staff, increment their pay, and get stored as an assignment
    // on a ServiceTable belonging to a different business entirely.
    const assignedEmployees = input.employeIds.length
      ? await prisma.employe.findMany({ where: { id: { in: input.employeIds }, businessId } })
      : [];
    if (assignedEmployees.length !== input.employeIds.length) {
      throw ApiError.badRequest("One or more employeIds are invalid");
    }
    const dailyPaidEmployees = assignedEmployees.filter((e) => e.typePaie === "JOURNALIERE");

    const [service] = await prisma.$transaction([
      prisma.serviceTable.create({
        data: { ...input, nombreInvites, total, utilisateurId: req.user!.id, businessId }
      }),
      prisma.reservation.update({
        where: { id: input.reservationId },
        data: { totalAPayer: { increment: total } }
      }),
      ...(input.traiteurId
        ? [
            prisma.traiteur.update({
              where: { id: input.traiteurId },
              data: { dettes: { increment: total } }
            })
          ]
        : []),
      ...dailyPaidEmployees
        .filter((e) => e.paieParJour != null)
        .map((e) =>
          prisma.employe.update({
            where: { id: e.id },
            data: { montantAPayer: { increment: e.paieParJour! } }
          })
        )
    ]);

    res.status(201).json(service);
  })
);

export default router;
