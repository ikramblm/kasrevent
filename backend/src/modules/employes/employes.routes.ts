import { Router } from "express";
import { prisma } from "../../utils/prisma";
import { authenticate, authorize } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { asyncHandler, ApiError } from "../../middleware/errors";
import { createEmployeSchema } from "./employes.schemas";
import { runMonthlyPayroll } from "./payroll";

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
 * Manual trigger for the same monthly-payroll logic the daily cron runs automatically
 * (see index.ts) — kept as an Admin-callable endpoint too, e.g. to run it immediately
 * without waiting for the next scheduled tick, or to verify it worked.
 */
router.post(
  "/run-monthly-payroll",
  asyncHandler(async (_req, res) => {
    const updated = await runMonthlyPayroll();
    res.json({ paidCount: updated.length, employees: updated });
  })
);

export default router;
