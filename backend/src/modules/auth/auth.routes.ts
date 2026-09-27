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

async function activateAccount(email: string, secret: string) {
  if (!isValidActivationSecret(secret, process.env.ACTIVATION_SECRET)) {
    throw ApiError.unauthorized("Invalid activation secret");
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw ApiError.notFound("User not found");
  if (user.actif) return { alreadyActive: true, user };
  await prisma.user.update({ where: { id: user.id }, data: { actif: true } });
  return { alreadyActive: false, user };
}

function activationPage(title: string, message: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{font-family:system-ui,sans-serif;text-align:center;padding:60px 20px;background:#f5f5f5}
h1{font-size:1.4rem}p{color:#555}</style></head>
<body><h1>${title}</h1><p>${message}</p></body></html>`;
}

/**
 * Activates a deployment's owner account once its one-time license fee has been paid
 * (handled outside the app, e.g. cash) — deliberately unauthenticated since an inactive
 * account can't obtain a JWT to call an authenticated endpoint. Gated by ACTIVATION_SECRET,
 * a value only the app's operator knows, set per-deployment as a Railway environment variable.
 *
 * Exposed as both POST (JSON, for scripts/tests) and GET (returns an HTML page, so opening a
 * bookmarked link like /api/auth/activate?email=...&secret=... in any phone browser is enough
 * to activate a customer's account on the spot after they pay).
 */
router.post(
  "/activate",
  activateLimiter,
  validateBody(activateSchema),
  asyncHandler(async (req, res) => {
    const { email, secret } = req.body;
    const { alreadyActive } = await activateAccount(email, secret);
    res.json({ message: alreadyActive ? "Account already active" : "Account activated", alreadyActive });
  })
);

router.get(
  "/activate",
  activateLimiter,
  asyncHandler(async (req, res) => {
    const email = String(req.query.email ?? "");
    const secret = String(req.query.secret ?? "");
    const parsed = activateSchema.safeParse({ email, secret });
    if (!parsed.success) {
      return res.status(400).send(activationPage("Lien invalide", "Email ou secret manquant/invalide dans le lien."));
    }
    try {
      const { alreadyActive, user } = await activateAccount(parsed.data.email, parsed.data.secret);
      res.send(
        activationPage(
          alreadyActive ? "Déjà activé" : "Compte activé ✅",
          alreadyActive
            ? `Le compte ${user.email} était déjà actif.`
            : `Le compte ${user.email} est maintenant activé. Le client peut se connecter.`
        )
      );
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 500;
      const msg = err instanceof ApiError ? err.message : "Erreur inattendue.";
      res.status(status).send(activationPage("Échec de l'activation", msg));
    }
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
