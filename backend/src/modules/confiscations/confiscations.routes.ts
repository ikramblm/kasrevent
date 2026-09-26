import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { authenticate } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { asyncHandler, ApiError } from "../../middleware/errors";

const router = Router();
router.use(authenticate);

const createSchema = z.object({
  reservationId: z.string().min(1),
  inviteId: z.string().min(1).optional(),
  clientId: z.string().min(1).optional(),
  numeroTelephone: z.string().optional(),
  photoTelephone: z.string().optional()
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { statut } = req.query as { statut?: string };
    const items = await prisma.confiscationTelephone.findMany({
      where: { statut: statut as any },
      include: { invite: true, reservation: true },
      orderBy: { heureConfiscation: "desc" }
    });
    res.json(items);
  })
);

router.post(
  "/",
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const item = await prisma.confiscationTelephone.create({
      data: { ...req.body, statut: "CONFISQUE", utilisateurId: req.user!.id }
    });
    res.status(201).json(item);
  })
);

/** "Restitution" action: records the return time and flips status to Restitué. */
router.post(
  "/:id/restitute",
  asyncHandler(async (req, res) => {
    const item = await prisma.confiscationTelephone.findUnique({ where: { id: req.params.id } });
    if (!item) throw ApiError.notFound("Confiscation record not found");
    const updated = await prisma.confiscationTelephone.update({
      where: { id: req.params.id },
      data: { statut: "RESTITUE", heureRestitution: new Date() }
    });
    res.json(updated);
  })
);

export default router;
