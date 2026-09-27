import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { hashPassword } from "../../utils/password";
import { authenticate, authorize } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { asyncHandler, ApiError } from "../../middleware/errors";

const router = Router();

// An Admin manages their own business's staff only — GERANT/USER, never another ADMIN
// or SUPERADMIN (that tier is created exclusively via the businesses module).
export const createSchema = z.object({
  nom: z.string().min(1),
  email: z.string().email(),
  telephone: z.string().optional(),
  role: z.enum(["GERANT", "USER"]).default("USER"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

export const updateSchema = z.object({
  nom: z.string().min(1).optional(),
  telephone: z.string().optional(),
  role: z.enum(["GERANT", "USER"]).optional(),
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
  asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({
      where: { businessId: req.user!.businessId },
      orderBy: { nom: "asc" }
    });
    res.json(users.map(toPublicUser));
  })
);

router.post(
  "/",
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const { password, ...rest } = req.body as z.infer<typeof createSchema>;
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { ...rest, passwordHash, businessId: req.user!.businessId }
    });
    res.status(201).json(toPublicUser(user));
  })
);

// Fetches the target user and 404s if it's not one of the caller's own business's
// accounts — previously any Admin could read/edit/delete any user id in the system.
async function findOwnBusinessUser(req: import("express").Request) {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user || user.businessId !== req.user!.businessId) throw ApiError.notFound("User not found");
  return user;
}

router.patch(
  "/:id",
  validateBody(updateSchema),
  asyncHandler(async (req, res) => {
    await findOwnBusinessUser(req);
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
    await findOwnBusinessUser(req);
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

export default router;
