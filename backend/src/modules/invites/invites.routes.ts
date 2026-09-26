import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { authenticate } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { asyncHandler, ApiError } from "../../middleware/errors";
import { generateQrDataUrl } from "../../utils/qrcode";

const router = Router();
router.use(authenticate);

const createSchema = z.object({
  reservationId: z.string().min(1),
  clientId: z.string().min(1).optional(),
  nom: z.string().min(1),
  prenom: z.string().optional(),
  telephone: z.string().optional(),
  statut: z.enum(["CONFIRME", "NON_CONFIRME"]).default("NON_CONFIRME")
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { reservationId } = req.query as { reservationId?: string };
    const invites = await prisma.invite.findMany({
      where: { reservationId },
      orderBy: { createdAt: "desc" }
    });
    res.json(invites);
  })
);

router.post(
  "/",
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    // `qrCodeToken` defaults to a fresh random uuid() at the DB layer — this reproduces
    // `Invités.QR Code`'s auto-generated, per-guest scannable identifier.
    const invite = await prisma.invite.create({ data: { ...req.body, utilisateurId: req.user!.id } });
    res.status(201).json(invite);
  })
);

/** Renders the guest's QR code as a PNG data URL (replaces the original's quickchart.io call). */
router.get(
  "/:id/qrcode",
  asyncHandler(async (req, res) => {
    const invite = await prisma.invite.findUnique({ where: { id: req.params.id } });
    if (!invite) throw ApiError.notFound("Guest not found");
    const dataUrl = await generateQrDataUrl(invite.qrCodeToken);
    res.json({ qrCodeDataUrl: dataUrl });
  })
);

router.patch(
  "/:id",
  validateBody(createSchema.partial()),
  asyncHandler(async (req, res) => {
    const invite = await prisma.invite.update({ where: { id: req.params.id }, data: req.body });
    res.json(invite);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.invite.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

export default router;
