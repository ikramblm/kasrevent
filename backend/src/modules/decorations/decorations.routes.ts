import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { crudRouter } from "../../utils/crudFactory";

const createSchema = z.object({
  nom: z.string().min(1),
  type: z.enum(["FLEURS", "TAPIS", "CHAISES", "TABLES", "SCULPTURE"]),
  stockDisponible: z.number().int().nonnegative().optional(),
  prixLocation: z.number().nonnegative().optional(),
  utilisateurId: z.string().uuid().optional()
});

export default crudRouter(prisma.decoration, {
  createSchema,
  updateSchema: createSchema.partial(),
  orderBy: { nom: "asc" }
});
