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
