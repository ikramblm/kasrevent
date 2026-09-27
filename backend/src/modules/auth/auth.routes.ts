import { Router } from "express";
import { prisma } from "../../utils/prisma";
import { verifyPassword } from "../../utils/password";
import { signToken } from "../../utils/jwt";
import { validateBody } from "../../middleware/validate";
import { loginSchema, activateSchema } from "./auth.schemas";
import { asyncHandler, ApiError } from "../../middleware/errors";
import { authenticate } from "../../middleware/auth";
import { isValidActivationSecret } from "../../utils/activation";
import rateLimit from "express-rate-limit";

const router = Router();

/**
 * Replaces the original app's `Connexion` table (a manually-authored login form that did a
 * plaintext string comparison against `Utilisateurs.Mot de passe`, see docs/ASSUMPTIONS.md).
 * Rate-limited to blunt brute-force guessing, which the original had no protection against.
 */
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

// Stricter than login: this endpoint's only gate is a shared secret, not a per-user password.
const activateLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });

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
    if (!user.actif) {
      throw ApiError.forbidden("Ce compte n'est pas encore activé. Contactez le support pour l'activer.");
    }

    const token = signToken({ sub: user.id, role: user.role, email: user.email });
    res.json({
      token,
      user: { id: user.id, nom: user.nom, email: user.email, role: user.role }
    });
  })
);

/**
 * Activates a deployment's owner account once its one-time license fee has been paid
 * (handled outside the app, e.g. cash) — deliberately unauthenticated since an inactive
 * account can't obtain a JWT to call an authenticated endpoint. Gated by ACTIVATION_SECRET,
 * a value only the app's operator knows, set per-deployment as a Railway environment variable.
 */
router.post(
  "/activate",
  activateLimiter,
  validateBody(activateSchema),
  asyncHandler(async (req, res) => {
    const { email, secret } = req.body;
    if (!isValidActivationSecret(secret, process.env.ACTIVATION_SECRET)) {
      throw ApiError.unauthorized("Invalid activation secret");
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw ApiError.notFound("User not found");
    if (user.actif) {
      return res.json({ message: "Account already active", alreadyActive: true });
    }
    await prisma.user.update({ where: { id: user.id }, data: { actif: true } });
    res.json({ message: "Account activated", alreadyActive: false });
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
