import { prisma } from "../../utils/prisma";

/**
 * Pure reimplementation of `Employés.Paie à Ajouter`:
 *   =IF(AND(DAY(TODAY())=[Jour de Paie],
 *           OR(ISBLANK([Dernière Date de Paie]), MONTH([Dernière Date de Paie])<>MONTH(TODAY()))),
 *       [Paie Mensuelle], 0)
 * Extracted as a pure function (no Prisma/Date.now() dependency at the boundary) so it is
 * unit-testable without a database.
 */
export function isMonthlyPayrollDue(params: { jourDePaie: number | null; derniereDatePaie: Date | null; today: Date }): boolean {
  const { jourDePaie, derniereDatePaie, today } = params;
  if (jourDePaie == null) return false;
  if (today.getDate() !== jourDePaie) return false;
  if (!derniereDatePaie) return true;
  return derniereDatePaie.getMonth() !== today.getMonth() || derniereDatePaie.getFullYear() !== today.getFullYear();
}

/**
 * Reproduces the "Paie mensuelle - 1" bot (Ajouter Paie Mensuelle + Enregistrer la date de
 * paiement, chained): for every Mensuelle-paid employee whose `jourDePaie` is today and who
 * hasn't already been paid this month, add `paieMensuelle` to `montantAPayer` and stamp
 * `derniereDatePaie`. Shared by the Admin-triggered endpoint and the daily cron (index.ts)
 * so both go through the exact same logic.
 */
export async function runMonthlyPayroll(today: Date = new Date()) {
  const employes = await prisma.employe.findMany({ where: { typePaie: "MENSUELLE" } });

  const due = employes.filter((e) => isMonthlyPayrollDue({ jourDePaie: e.jourDePaie, derniereDatePaie: e.derniereDatePaie, today }));

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

  return updated;
}
