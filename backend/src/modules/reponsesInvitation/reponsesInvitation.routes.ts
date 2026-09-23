import { Router } from "express";
import { prisma } from "../../utils/prisma";
import { authenticate } from "../../middleware/auth";
import { asyncHandler, ApiError } from "../../middleware/errors";

const router = Router();
router.use(authenticate);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { reservationId } = req.query as { reservationId?: string };
    const reponses = await prisma.reponseInvitation.findMany({
      where: { reservationId },
      orderBy: { createdAt: "desc" }
    });
    res.json(reponses);
  })
);

/**
 * Reproduces "Confirmer l'invité": promotes an RSVP into a real `Invite` row (which gets
 * its own QR check-in code).
 */
router.post(
  "/:id/confirmer",
  asyncHandler(async (req, res) => {
    const reponse = await prisma.reponseInvitation.findUnique({ where: { id: req.params.id } });
    if (!reponse) throw ApiError.notFound("Reponse not found");

    const [nom, ...rest] = reponse.nomPrenom.split(" ");
    const invite = await prisma.invite.create({
      data: {
        reservationId: reponse.reservationId,
        nom: nom || reponse.nomPrenom,
        prenom: rest.join(" ") || undefined,
        telephone: reponse.numeroTelephone ?? undefined,
        statut: "CONFIRME",
        utilisateurId: req.user!.id
      }
    });

    res.status(201).json(invite);
  })
);

export default router;
