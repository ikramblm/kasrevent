import { Router } from "express";
import { prisma } from "../../utils/prisma";
import { authenticate, authorize } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../middleware/errors";
import { createChargeSchema } from "./charges.schemas";
import { createChargeWithSideEffects } from "./charges.service";

const router = Router();
// Charges are Admin/Gerant-only, mirroring the "Charges" menu view's role gate.
router.use(authenticate, authorize("ADMIN", "GERANT"));

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { type } = req.query as { type?: string };
    const charges = await prisma.charge.findMany({
      where: { type: type as any },
      include: { fournisseur: true, traiteur: true, employe: true },
      orderBy: { dateHeure: "desc" }
    });
    res.json(charges);
  })
);

router.post(
  "/",
  validateBody(createChargeSchema),
  asyncHandler(async (req, res) => {
    const charge = await createChargeWithSideEffects(req.body, req.user!.id);
    res.status(201).json(charge);
  })
);

export default router;
