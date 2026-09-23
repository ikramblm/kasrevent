import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { hashPassword } from "../../utils/password";
import { authenticate, authorize } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { asyncHandler, ApiError } from "../../middleware/errors";

const router = Router();

const createSchema = z.object({
  nom: z.string().min(1),
  email: z.string().email(),
  telephone: z.string().optional(),
  role: z.enum(["ADMIN", "GERANT", "USER"]).default("USER"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

const updateSchema = z.object({
  nom: z.string().min(1).optional(),
  telephone: z.string().optional(),
  role: z.enum(["ADMIN", "GERANT", "USER"]).optional(),
  password: z.string().min(8).optional()
});

function toPublicUser(user: { id: string; nom: string; email: string | null; role: string; telephone: string | null; createdAt: Date }) {
  return { id: user.id, nom: user.nom, email: user.email, role: user.role, telephone: user.telephone, createdAt: user.createdAt };
}

// User management is Admin-only, mirroring the "Utilisateurs" menu view's
// `USERSETTINGS("Rôle") = "Admin"` gate — enforced here server-side, not just hidden in the UI.
router.use(authenticate, authorize("ADMIN"));

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({ orderBy: { nom: "asc" } });
    res.json(users.map(toPublicUser));
  })
);

router.post(
  "/",
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const { password, ...rest } = req.body as z.infer<typeof createSchema>;
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({ data: { ...rest, passwordHash } });
    res.status(201).json(toPublicUser(user));
  })
);

router.patch(
  "/:id",
  validateBody(updateSchema),
  asyncHandler(async (req, res) => {
    const { password, ...rest } = req.body as z.infer<typeof updateSchema>;
    const data: Record<string, unknown> = { ...rest };
    if (password) data.passwordHash = await hashPassword(password);
    const user = await prisma.user.update({ where: { id: req.params.id }, data });
    res.json(toPublicUser(user));
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user!.id) {
      throw ApiError.badRequest("You cannot delete your own account");
    }
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

export default router;
