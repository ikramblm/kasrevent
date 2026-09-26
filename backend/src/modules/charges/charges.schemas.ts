import { z } from "zod";

export const typeChargeEnum = z.enum([
  "ACHAT",
  "APPROVISIONNEMENT",
  "PAIEMENT_SALAIRE",
  "PAIEMENT_DETTES_FOURNISSEURS",
  "PAIEMENT_DETTES_TRAITEURS",
  "PAIEMENT_FACTURES",
  "INVESTISSEMENT",
  "REPARATION",
  "AUTRE"
]);

export const createChargeSchema = z.object({
  type: typeChargeEnum,
  fournisseurId: z.string().min(1).optional(),
  traiteurId: z.string().min(1).optional(),
  employeId: z.string().min(1).optional(),
  moisPaye: z.string().optional(),
  montantTotal: z.number().nonnegative().default(0),
  methodePaiement: z.enum(["ESPECE", "CHEQUE", "VIREMENT", "AUTRE"]).default("ESPECE"),
  montantPaye: z.number().nonnegative().default(0),
  description: z.string().optional(),
  photo: z.string().optional()
});
