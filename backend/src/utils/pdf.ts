import PDFDocument from "pdfkit";
import type { Response } from "express";

/**
 * Shared KasrEvent letterhead for every generated PDF (invoice, guest pass, …). These are
 * new, hand-built layouts — the original AppSheet app's actual Google Doc templates were
 * never included in the documentation export this rebuild was based on (see
 * docs/ASSUMPTIONS.md #8), so this reproduces the *function* (a real, downloadable PDF for
 * each of these documents) rather than the original's exact visual design.
 */
export function startPdf(res: Response, filename: string): PDFKit.PDFDocument {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
  doc.pipe(res);

  doc.fontSize(20).fillColor("#3B5BDB").text("KasrEvent 🏰", { align: "left" });
  doc.fontSize(9).fillColor("#6B7280").text("Application de gestion de salles d'évènements");
  doc.moveDown(1.5);
  doc.strokeColor("#E5E7EB").moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(1);
  doc.fillColor("#111827");

  return doc;
}

/** Accepts a plain number/string or a Prisma Decimal (anything stringifiable). */
export function money(value: number | string | { toString(): string }): string {
  return `${Number(value.toString()).toLocaleString("fr-FR")} DA`;
}
