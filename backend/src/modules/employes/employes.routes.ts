import { Router } from "express";
import { prisma } from "../../utils/prisma";
import { authenticate, authorize } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { asyncHandler, ApiError } from "../../middleware/errors";
import { createEmployeSchema } from "./employes.schemas";
import { isMonthlyPayrollDue } from "./payroll";

const router = Router();
// Employés management is Admin-only, mirroring the "Employés" menu view's role gate.
router.use(authenticate, authorize("ADMIN"));

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const employes = await prisma.employe.findMany({ orderBy: { nom: "asc" } });
    res.json(employes);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const employe = await prisma.employe.findUnique({
      where: { id: req.params.id },
      include: { historiquePaie: { orderBy: { date: "desc" } } }
    });
    if (!employe) throw ApiError.notFound("Employé not found");
    res.json(employe);
  })
);

router.post(
  "/",
  validateBody(createEmployeSchema),
  asyncHandler(async (req, res) => {
    const employe = await prisma.employe.create({ data: req.body });
    res.status(201).json(employe);
  })
);

router.patch(
  "/:id",
  validateBody(createEmployeSchema.partial()),
  asyncHandler(async (req, res) => {
    const employe = await prisma.employe.update({ where: { id: req.params.id }, data: req.body });
    res.json(employe);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.employe.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

/**
 * Reproduces the "Paie mensuelle - 1" bot (Ajouter Paie Mensuelle + Enregistrer la date de
 * paiement, chained): for every Mensuelle-paid employee whose `jourDePaie` is today and who
 * hasn't already been paid this month, add `paieMensuelle` to `montantAPayer` and stamp
 * `derniereDatePaie`. Since the original app's actual Bot trigger/schedule is not in the
 * export (see docs/APP_MIGRATION_STATUS.md), this is exposed as an Admin-triggered endpoint
 * rather than an automatic daily cron — wire it to a scheduler if daily automation is wanted.
 */
router.post(
  "/run-monthly-payroll",
  asyncHandler(async (_req, res) => {
    const today = new Date();
    const employes = await prisma.employe.findMany({ where: { typePaie: "MENSUELLE" } });

    const due = employes.filter((e) =>
      isMonthlyPayrollDue({ jourDePaie: e.jourDePaie, derniereDatePaie: e.derniereDatePaie, today })
    );

    const updated = await prisma.$transaction(
      due.map((e) =>
        prisma.employe.update({
          where: { id: e.id },
          data: {
            montantAPayer: { increment: e.paieMensuelle ?? 0 },
            derniereDatePaie: today
          }
        })
      )
    );

    res.json({ paidCount: updated.length, employees: updated });
  })
);

export default router;
