import { Router } from "express";
import { prisma } from "../../utils/prisma";
import { hashPassword } from "../../utils/password";
import { authenticate, authorize } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../middleware/errors";
import { createBusinessSchema } from "./businesses.schemas";

const router = Router();

// Onboarding a new paying customer is Super Admin-only — the app owner creates each
// business (and its first Admin account) personally after being paid, cash, outside
// the app; see docs on the account-activation feature for the one-time-fee model this
// replaces for the shared multi-tenant deployment.
router.use(authenticate, authorize("SUPERADMIN"));

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const businesses = await prisma.business.findMany({
      orderBy: { createdAt: "desc" },
      include: { users: { where: { role: "ADMIN" }, select: { nom: true, email: true } } }
    });
    res.json(
      businesses.map((b) => ({
        id: b.id,
        nom: b.nom,
        createdAt: b.createdAt,
        adminNom: b.users[0]?.nom ?? null,
        adminEmail: b.users[0]?.email ?? null
      }))
    );
  })
);

/**
 * Creates the Business and its first Admin account together in one transaction — there's
 * no useful state where a Business exists with no Admin. Created active (`actif: true`)
 * since the owner only calls this after the one-time license fee has already been paid.
 */
router.post(
  "/",
  validateBody(createBusinessSchema),
  asyncHandler(async (req, res) => {
    const { businessNom, adminNom, adminEmail, adminPassword } = req.body as import("./businesses.schemas").CreateBusinessInput;
    const passwordHash = await hashPassword(adminPassword);

    const result = await prisma.$transaction(async (tx) => {
      const business = await tx.business.create({ data: { nom: businessNom } });
      const admin = await tx.user.create({
        data: {
          nom: adminNom,
          email: adminEmail,
          passwordHash,
          role: "ADMIN",
          businessId: business.id,
          actif: true
        }
      });
      return { business, admin };
    });

    res.status(201).json({
      id: result.business.id,
      nom: result.business.nom,
      createdAt: result.business.createdAt,
      adminNom: result.admin.nom,
      adminEmail: result.admin.email
    });
  })
);

export default router;
