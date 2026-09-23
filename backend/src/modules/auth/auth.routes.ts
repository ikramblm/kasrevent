import { Router } from "express";
import { prisma } from "../../utils/prisma";
import { verifyPassword } from "../../utils/password";
import { signToken } from "../../utils/jwt";
import { validateBody } from "../../middleware/validate";
import { loginSchema } from "./auth.schemas";
import { asyncHandler, ApiError } from "../../middleware/errors";
import { authenticate } from "../../middleware/auth";
import rateLimit from "express-rate-limit";

const router = Router();

/**
 * Replaces the original app's `Connexion` table (a manually-authored login form that did a
 * plaintext string comparison against `Utilisateurs.Mot de passe`, see docs/ASSUMPTIONS.md).
 * Rate-limited to blunt brute-force guessing, which the original had no protection against.
 */
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

router.post(
  "/login",
  loginLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    const ok = user ? await verifyPassword(password, user.passwordHash) : false;
    if (user) {
      await prisma.loginEvent.create({ data: { userId: user.id, success: ok } });
    }
    if (!user || !ok) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const token = signToken({ sub: user.id, role: user.role, email: user.email });
    res.json({
      token,
      user: { id: user.id, nom: user.nom, email: user.email, role: user.role }
    });
  })
);

router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw ApiError.notFound("User not found");
    res.json({ id: user.id, nom: user.nom, email: user.email, role: user.role, telephone: user.telephone });
  })
);

export default router;
