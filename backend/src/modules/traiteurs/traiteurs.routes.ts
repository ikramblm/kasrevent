import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { crudRouter } from "../../utils/crudFactory";

const createSchema = z.object({
  nom: z.string().min(1),
  specialite: z.array(z.string()).optional(),
  contact: z.string().optional(),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  tarifs: z.number().nonnegative().optional(),
  photo: z.string().optional(),
  siteWeb: z.string().url().optional(),
  utilisateurId: z.string().uuid().optional()
});

export default crudRouter(prisma.traiteur, {
  createSchema,
  updateSchema: createSchema.partial(),
  writeRoles: ["ADMIN", "GERANT"],
  orderBy: { nom: "asc" }
});
