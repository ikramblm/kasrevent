import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { authenticate, authorize } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../middleware/errors";

const router = Router();

const updateSchema = z.object({
  nom: z.string().optional(),
  lienFacebook: z.string().url().optional(),
  lienInstagram: z.string().url().optional(),
  lienUtile: z.string().url().optional(),
  numeroWhatsapp: z.string().optional()
});

router.get(
  "/",
  authenticate,
  asyncHandler(async (_req, res) => {
    const config = await prisma.adminConfig.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" }
    });
    res.json(config);
  })
);

router.patch(
  "/",
  authenticate,
  authorize("ADMIN"),
  validateBody(updateSchema),
  asyncHandler(async (req, res) => {
    const config = await prisma.adminConfig.upsert({
      where: { id: "singleton" },
      update: req.body,
      create: { id: "singleton", ...req.body }
    });
    res.json(config);
  })
);

export default router;
