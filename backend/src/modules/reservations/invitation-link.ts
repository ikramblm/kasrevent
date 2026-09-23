import { env } from "../../config/env";

/**
 * Reproduces `Réservations.Lien D'invitation`, which built a pre-filled Google Form URL
 * embedding the client name, event type, date and room. Since this rebuild has no
 * dependency on Google Forms, it instead links to this app's own public RSVP page
 * (`/rsvp/:reservationId`), which creates a `ReponseInvitation` row — the same role the
 * Google Form response sheet played in the original (see docs/ASSUMPTIONS.md).
 */
export function buildInvitationLink(reservation: { id: string }): string {
  return `${env.publicAppUrl}/rsvp/${reservation.id}`;
}
