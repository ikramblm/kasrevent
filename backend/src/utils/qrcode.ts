import QRCode from "qrcode";
import { env } from "../config/env";

/**
 * The original app generated guest QR images by calling the public quickchart.io API with
 * the guest's row key encoded in plain text. Here we generate the QR image locally (no
 * third-party network call) and encode an opaque per-guest token (`Invite.qrCodeToken`,
 * a random UUID) rather than the guest's real database id, so a photographed/shared QR
 * code cannot be used to guess or enumerate other guest records.
 */
export function buildCheckInUrl(qrCodeToken: string): string {
  return `${env.publicAppUrl}/checkin/scan?token=${encodeURIComponent(qrCodeToken)}`;
}

export async function generateQrDataUrl(qrCodeToken: string): Promise<string> {
  const payload = buildCheckInUrl(qrCodeToken);
  return QRCode.toDataURL(payload, { width: 300, margin: 1 });
}
