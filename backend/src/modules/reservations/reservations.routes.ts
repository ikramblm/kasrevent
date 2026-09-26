import { Router } from "express";
import { prisma } from "../../utils/prisma";
import { authenticate } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { asyncHandler, ApiError } from "../../middleware/errors";
import { createReservationSchema, updateReservationSchema } from "./reservations.schemas";
import { archiveReservation, assertRoomAvailable, closeReservation, withComputed } from "./reservations.service";
import { buildInvitationLink } from "./invitation-link";
import { startPdf, money } from "../../utils/pdf";

const router = Router();
router.use(authenticate);

const includeRelations = {
  client: true,
  salle: true,
  invites: true,
  servicesTables: true
};

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { statut, clientId, salleId } = req.query as Record<string, string | undefined>;
    const reservations = await prisma.reservation.findMany({
      where: {
        statut: statut as any,
        clientId,
        salleId
      },
      include: includeRelations,
      orderBy: { dateDebut: "desc" }
    });
    res.json(reservations.map(withComputed));
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const reservation = await prisma.reservation.findUnique({
      where: { id: req.params.id },
      include: { ...includeRelations, accesInvites: true, confiscations: true }
    });
    if (!reservation) throw ApiError.notFound("Reservation not found");
    res.json({ ...withComputed(reservation), invitationLink: buildInvitationLink(reservation) });
  })
);

router.post(
  "/",
  validateBody(createReservationSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as any;
    if (data.salleId) {
      await assertRoomAvailable({ salleId: data.salleId, dateDebut: data.dateDebut, dateFin: data.dateFin });
    }
    const reservation = await prisma.reservation.create({
      data: { ...data, utilisateurId: req.user!.id },
      include: includeRelations
    });
    res.status(201).json(withComputed(reservation));
  })
);

router.patch(
  "/:id",
  validateBody(updateReservationSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.reservation.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound("Reservation not found");

    const data = req.body as any;
    const nextSalleId = data.salleId ?? existing.salleId;
    const nextDebut = data.dateDebut ?? existing.dateDebut;
    const nextFin = data.dateFin ?? existing.dateFin;
    if (nextSalleId) {
      await assertRoomAvailable({
        salleId: nextSalleId,
        dateDebut: nextDebut,
        dateFin: nextFin,
        excludeReservationId: existing.id
      });
    }

    const reservation = await prisma.reservation.update({
      where: { id: req.params.id },
      data,
      include: includeRelations
    });
    res.json(withComputed(reservation));
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.reservation.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

/** "Clôturer" action. */
router.post(
  "/:id/close",
  asyncHandler(async (req, res) => {
    const reservation = await closeReservation(req.params.id);
    res.json(withComputed(reservation));
  })
);

/**
 * Reproduces the "Facture de reservation pdf" automation (the "Créer facture" flag's
 * target, never a real document before this — see docs/ASSUMPTIONS.md #8). Produces an
 * actual downloadable invoice PDF; the layout is new (the original's Google Doc template
 * was never in the export), but the document itself is real.
 */
router.get(
  "/:id/invoice.pdf",
  asyncHandler(async (req, res) => {
    const reservation = await prisma.reservation.findUnique({
      where: { id: req.params.id },
      include: { client: true, salle: true, servicesTables: { include: { traiteur: true } } }
    });
    if (!reservation) throw ApiError.notFound("Reservation not found");
    const { resteAPayer } = withComputed(reservation);

    const doc = startPdf(res, `facture-${reservation.id}.pdf`);
    doc.fontSize(16).text("Facture de réservation", { align: "right" });
    doc.fontSize(10).fillColor("#6B7280").text(`Réf. ${reservation.id}`, { align: "right" });
    doc.text(`Émise le ${new Date().toLocaleDateString("fr-FR")}`, { align: "right" });
    doc.moveDown(1.5);

    doc.fillColor("#111827").fontSize(12).text("Client", { underline: true });
    doc.fontSize(11).text(`${reservation.client.nom} ${reservation.client.prenom ?? ""}`);
    if (reservation.client.telephone) doc.text(reservation.client.telephone);
    if (reservation.client.email) doc.text(reservation.client.email);
    doc.moveDown(1);

    doc.fontSize(12).text("Évènement", { underline: true });
    doc.fontSize(11).text(`Type : ${reservation.typeEvenement}`);
    doc.text(`Du ${reservation.dateDebut.toLocaleDateString("fr-FR")} au ${reservation.dateFin.toLocaleDateString("fr-FR")}`);
    if (reservation.salle) doc.text(`Salle : ${reservation.salle.nom}`);
    doc.text(`Invités : ${reservation.nombreInvites}`);
    doc.moveDown(1);

    if (reservation.servicesTables.length > 0) {
      doc.fontSize(12).text("Services", { underline: true });
      for (const s of reservation.servicesTables) {
        doc.fontSize(11).text(`${s.typeService}${s.traiteur ? ` (${s.traiteur.nom})` : ""} — ${money(s.total)}`);
      }
      doc.moveDown(1);
    }

    doc.fontSize(12).text("Montants", { underline: true });
    doc.fontSize(11);
    doc.text(`Total à payer : ${money(reservation.totalAPayer)}`);
    doc.text(`Avance versée : ${money(reservation.avanceVersee)}`);
    doc.fillColor(resteAPayer > 0 ? "#DC2626" : "#16A34A").text(`Reste à payer : ${money(resteAPayer)}`);

    doc.end();
  })
);

/** Reproduces the "Invité pdf" automation — a printable guest pass with the check-in QR code. */
router.get(
  "/:id/invites/:inviteId/pass.pdf",
  asyncHandler(async (req, res) => {
    const invite = await prisma.invite.findFirst({
      where: { id: req.params.inviteId, reservationId: req.params.id },
      include: { reservation: { include: { client: true, salle: true } } }
    });
    if (!invite) throw ApiError.notFound("Invite not found");

    const { generateQrDataUrl } = await import("../../utils/qrcode");
    const qrDataUrl = await generateQrDataUrl(invite.qrCodeToken);
    const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");

    const doc = startPdf(res, `invite-${invite.id}.pdf`);
    doc.fontSize(16).text("Carte d'invité", { align: "right" });
    doc.moveDown(1.5);
    doc.fontSize(14).text(`${invite.nom} ${invite.prenom ?? ""}`);
    doc.fontSize(11).fillColor("#6B7280").text(`Invité de ${invite.reservation.client.nom}`);
    doc.text(
      `${invite.reservation.dateDebut.toLocaleDateString("fr-FR")} — ${invite.reservation.salle?.nom ?? "Lieu à confirmer"}`
    );
    doc.moveDown(1.5);
    doc.image(qrBuffer, { fit: [200, 200], align: "center" });
    doc.moveDown(1);
    doc.fontSize(10).fillColor("#6B7280").text("Présentez ce code à l'entrée pour le check-in.", { align: "center" });

    doc.end();
  })
);

/** "Archiv" / "Archiver et supprimer" actions. */
router.post(
  "/:id/archive",
  asyncHandler(async (req, res) => {
    const alsoDelete = req.query.alsoDelete === "true";
    const archive = await archiveReservation(req.params.id, alsoDelete);
    res.status(201).json(archive);
  })
);

export default router;
