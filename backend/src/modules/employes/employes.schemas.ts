import { z } from "zod";

export const createEmployeSchema = z.object({
  nom: z.string().min(1),
  prenom: z.string().optional(),
  role: z.string().min(1),
  telephone: z.string().optional(),
  email: z.string().email().optional(),
  disponibilite: z.boolean().default(true),
  typePaie: z.enum(["MENSUELLE", "JOURNALIERE"]).default("MENSUELLE"),
  paieMensuelle: z.number().nonnegative().optional(),
  paieParJour: z.number().nonnegative().optional(),
  jourDePaie: z.number().int().min(1).max(31).optional()
});
