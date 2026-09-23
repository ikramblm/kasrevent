import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { authenticate, authorize } from "../../middleware/auth";
import { validateQuery } from "../../middleware/validate";
import { asyncHandler } from "../../middleware/errors";

const router = Router();
router.use(authenticate, authorize("ADMIN", "GERANT"));

const querySchema = z.object({
  dateDebut: z.coerce.date().optional(),
  dateFin: z.coerce.date().optional()
});

const DEBT_PAYMENT_TYPES = ["PAIEMENT_DETTES_FOURNISSEURS", "PAIEMENT_DETTES_TRAITEURS"] as const;
const EXPENSE_TYPES = ["ACHAT", "APPROVISIONNEMENT", "PAIEMENT_FACTURES", "REPARATION"] as const;

/**
 * Reproduces the `Filtre` table's ~15 dashboard KPI formulas (revenue, receivables,
 * charges by category, investments, salary payments — all-time and date-range-filtered),
 * which fed the "Comptabilité" dashboard's "Total 💰" / "Filtre par Date 📆" tiles.
 */
router.get(
  "/",
  validateQuery(querySchema),
  asyncHandler(async (req, res) => {
    const { dateDebut, dateFin } = req.query as unknown as z.infer<typeof querySchema>;
    const dateRange = dateDebut && dateFin ? { gte: dateDebut, lte: dateFin } : undefined;

    const [
      allTimeAvance,
      allTimeTotal,
      chargesAllTime,
      dettesPaymentsAllTime,
      investissementsAllTime,
      salairesAllTime,
      resultatSelect,
      creanceAllTime,
      chargesSelect
    ] = await Promise.all([
      prisma.reservation.aggregate({ _sum: { avanceVersee: true } }),
      prisma.reservation.aggregate({ _sum: { totalAPayer: true } }),
      prisma.charge.aggregate({ _sum: { montantPaye: true }, where: { type: { in: [...EXPENSE_TYPES] } } }),
      prisma.charge.aggregate({ _sum: { montantPaye: true }, where: { type: { in: [...DEBT_PAYMENT_TYPES] } } }),
      prisma.charge.aggregate({ _sum: { montantPaye: true }, where: { type: "INVESTISSEMENT" } }),
      prisma.charge.aggregate({ _sum: { montantPaye: true }, where: { type: "PAIEMENT_SALAIRE" } }),
      prisma.reservation.aggregate({ _sum: { avanceVersee: true }, where: dateRange ? { dateDebut: dateRange } : undefined }),
      prisma.reservation.findMany({ select: { totalAPayer: true, avanceVersee: true } }),
      prisma.charge.aggregate({
        _sum: { montantPaye: true },
        where: { type: { in: [...EXPENSE_TYPES] }, dateHeure: dateRange }
      })
    ]);

    const creanceTotal = creanceAllTime.reduce((sum, r) => sum + Math.max(Number(r.totalAPayer) - Number(r.avanceVersee), 0), 0);

    res.json({
      chiffreAffaireTotal: Number(allTimeTotal._sum.totalAPayer ?? 0),
      revenusNet: Number(allTimeAvance._sum.avanceVersee ?? 0) - Number(chargesAllTime._sum.montantPaye ?? 0),
      charges: Number(chargesAllTime._sum.montantPaye ?? 0),
      chargesFiltre: Number(chargesSelect._sum.montantPaye ?? 0),
      paiementDeDettes: Number(dettesPaymentsAllTime._sum.montantPaye ?? 0),
      investissements: Number(investissementsAllTime._sum.montantPaye ?? 0),
      paiementSalaires: Number(salairesAllTime._sum.montantPaye ?? 0),
      resultatFiltre: Number(resultatSelect._sum.avanceVersee ?? 0),
      creanceTotal
    });
  })
);

export default router;
