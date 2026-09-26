import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { authenticate } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { asyncHandler, ApiError } from "../../middleware/errors";
import { computeAccessStatus } from "./access-window";

const router = Router();
router.use(authenticate);

const scanSchema = z.object({ token: z.string().min(1) });

/**
 * Reproduces the QR check-in flow:
 *  - `Invités.QR Code` (scanned) → `Accès Invités` row created, `Statut de l'accés` computed as
 *    `=IF(AND(Date Début<=TODAY(), Date Fin>=TODAY()), "Valide", "expiré")`, with a Valid_If
 *    that blocks the scan once expired ("⛔ Accés Interdit ⛔").
 *  - If the reservation's confiscation policy is on, cascades into a `Confiscations de
 *    Téléphones` row exactly like the "ajouter confiscation" / "confisquer" actions.
 */
router.post(
  "/scan",
  validateBody(scanSchema),
  asyncHandler(async (req, res) => {
    const invite = await prisma.invite.findUnique({
      where: { qrCodeToken: req.body.token },
      include: { reservation: true }
    });
    if (!invite) throw ApiError.notFound("QR code not recognized");

    const now = new Date();
    const statutAcces = computeAccessStatus({ dateDebut: invite.reservation.dateDebut, dateFin: invite.reservation.dateFin, now });

    const accesInvite = await prisma.accesInvite.create({
      data: {
        reservationId: invite.reservationId,
        inviteId: invite.id,
        statutAcces,
        utilisateurId: req.user!.id
      }
    });

    if (statutAcces === "EXPIRE") {
      return res.status(409).json({
        error: "⛔ Accés Interdit ⛔ — this reservation's date window has ended",
        accesInvite
      });
    }

    if (!invite.heureEntree) {
      await prisma.invite.update({ where: { id: invite.id }, data: { heureEntree: now } });
    }

    let confiscation = null;
    if (invite.reservation.confiscationPolicy) {
      confiscation = await prisma.confiscationTelephone.create({
        data: {
          reservationId: invite.reservationId,
          inviteId: invite.id,
          clientId: invite.clientId,
          numeroTelephone: invite.telephone,
          statut: "CONFISQUE",
          utilisateurId: req.user!.id
        }
      });
    }

    res.status(201).json({
      accesInvite,
      guest: { id: invite.id, nom: invite.nom, prenom: invite.prenom },
      confiscationCreated: confiscation
    });
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { reservationId } = req.query as { reservationId?: string };
    const log = await prisma.accesInvite.findMany({
      where: { reservationId },
      include: { invite: true },
      orderBy: { heureEntree: "desc" }
    });
    res.json(log);
  })
);

export default router;
