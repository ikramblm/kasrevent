import { z } from "zod";

export const typeEvenementEnum = z.enum(["MARIAGE", "SEMINAIRE", "ANNIVERSAIRE", "EVENEMENT", "AUTRE"]);
export const statutReservationEnum = z.enum(["EN_ATTENTE", "CONFIRMEE", "ANNULEE", "CLOTURE"]);

export const createReservationSchema = z.object({
  clientId: z.string().uuid(),
  dateDebut: z.coerce.date(),
  dateFin: z.coerce.date(),
  typeEvenement: typeEvenementEnum.default("AUTRE"),
  nombreInvites: z.number().int().nonnegative().default(0),
  salleId: z.string().uuid().optional(),
  note: z.string().optional(),
  confiscationPolicy: z.boolean().default(false),
  totalAPayer: z.number().nonnegative().default(0),
  avanceVersee: z.number().nonnegative().default(0)
});

export const updateReservationSchema = createReservationSchema.partial().extend({
  statut: statutReservationEnum.optional(),
  creerFacture: z.boolean().optional()
});
