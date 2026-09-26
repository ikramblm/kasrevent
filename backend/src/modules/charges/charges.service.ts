import { prisma } from "../../utils/prisma";
import { ApiError } from "../../middleware/errors";
import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import type { createChargeSchema } from "./charges.schemas";

type ChargeInput = z.infer<typeof createChargeSchema>;

const DEBT_INCREASING_TYPES = new Set(["ACHAT", "APPROVISIONNEMENT", "INVESTISSEMENT"]);

/**
 * The original app's "ajout de dette" and "Diminuer la dette" actions on `Fournisseurs`
 * (and their `diminuer/ajout de dette 2` counterparts on `Traiteurs`) both contained the
 * *same* add formula — almost certainly a copy-paste bug in the source app (flagged in
 * docs/ASSUMPTIONS.md and the spec's Overview §6.8). Rather than reproduce that bug, this
 * rebuild implements the evidently-intended behavior:
 *   - a purchase/investment/supply Charge against a Fournisseur INCREASES its debt by the
 *     unpaid remainder (montantTotal - montantPaye);
 *   - a "Paiement Dettes Fournisseurs" / "Paiement Dettes Traiteurs" Charge DECREASES the
 *     corresponding debt by the amount actually paid (montantPaye);
 *   - a "Paiement salaire" Charge DECREASES the employee's amount owed by montantPaye, and
 *     appends a row to `Historique de Paie` (reproducing the "Action for Creation de Row"
 *     ADD_RECORD_TO action).
 */
/** Never let a debt/amount-owed balance go negative from a payment larger than what's owed. */
export function clamp(current: Prisma.Decimal | number, delta: number): number {
  return Math.max(Number(current) - delta, 0);
}

export async function createChargeWithSideEffects(input: ChargeInput, utilisateurId: string) {
  const dettesNouvelles = input.montantTotal - input.montantPaye;

  return prisma.$transaction(async (tx) => {
    const charge = await tx.charge.create({ data: { ...input, utilisateurId } });

    if (input.fournisseurId && DEBT_INCREASING_TYPES.has(input.type)) {
      await tx.fournisseur.update({
        where: { id: input.fournisseurId },
        data: { dettes: { increment: dettesNouvelles } }
      });
    }

    if (input.fournisseurId && input.type === "PAIEMENT_DETTES_FOURNISSEURS") {
      const fournisseur = await tx.fournisseur.findUnique({ where: { id: input.fournisseurId } });
      if (!fournisseur) throw ApiError.notFound("Fournisseur not found");
      await tx.fournisseur.update({
        where: { id: input.fournisseurId },
        data: { dettes: clamp(fournisseur.dettes, input.montantPaye) }
      });
    }

    if (input.traiteurId && input.type === "PAIEMENT_DETTES_TRAITEURS") {
      const traiteur = await tx.traiteur.findUnique({ where: { id: input.traiteurId } });
      if (!traiteur) throw ApiError.notFound("Traiteur not found");
      await tx.traiteur.update({
        where: { id: input.traiteurId },
        data: { dettes: clamp(traiteur.dettes, input.montantPaye) }
      });
    }

    if (input.employeId && input.type === "PAIEMENT_SALAIRE") {
      const employe = await tx.employe.findUnique({ where: { id: input.employeId } });
      if (!employe) throw ApiError.notFound("Employé not found");

      await tx.employe.update({
        where: { id: input.employeId },
        data: { montantAPayer: clamp(employe.montantAPayer, input.montantPaye) }
      });

      await tx.historiquePaie.create({
        data: {
          employeId: input.employeId,
          moisPaye: input.moisPaye,
          date: charge.dateHeure,
          montant: input.montantTotal,
          methodePaiement: input.methodePaiement,
          montantPaye: input.montantPaye,
          detteAvant: employe.montantAPayer as unknown as Prisma.Decimal,
          description: input.description,
          utilisateurId
        }
      });
    }

    return charge;
  });
}
