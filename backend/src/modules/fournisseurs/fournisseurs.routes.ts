import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { crudRouter } from "../../utils/crudFactory";

const createSchema = z.object({
  company: z.string().min(1),
  nom: z.string().optional(),
  tel: z.string().optional(),
  adresse: z.string().optional(),
  logo: z.string().optional()
});

export default crudRouter(prisma.fournisseur, {
  createSchema,
  updateSchema: createSchema.partial(),
  writeRoles: ["ADMIN"],
  orderBy: { company: "asc" }
});
