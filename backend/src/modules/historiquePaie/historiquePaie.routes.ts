import { Router } from "express";
import { prisma } from "../../utils/prisma";
import { authenticate, authorize } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/errors";

const router = Router();
router.use(authenticate, authorize("ADMIN", "GERANT"));

// Rows here are created automatically as a side effect of a "Paiement salaire" Charge
// (see charges.service.ts) — this endpoint is read-only, mirroring the original table's
// role as a payroll history log rather than a manually-entered ledger.
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { employeId } = req.query as { employeId?: string };
    const rows = await prisma.historiquePaie.findMany({
      where: { employeId },
      include: { employe: true },
      orderBy: { date: "desc" }
    });
    res.json(rows);
  })
);

export default router;
