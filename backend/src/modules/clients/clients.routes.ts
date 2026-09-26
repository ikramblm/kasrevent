import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { crudRouter } from "../../utils/crudFactory";

const createSchema = z.object({
  nom: z.string().min(1),
  prenom: z.string().optional(),
  telephone: z.string().optional(),
  email: z.string().email().optional(),
  adresse: z.string().optional(),
  utilisateurId: z.string().min(1).optional()
});

const updateSchema = createSchema.partial();

export default crudRouter(prisma.client, {
  createSchema,
  updateSchema,
  orderBy: { createdAt: "desc" }
});
