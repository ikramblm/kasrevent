/**
 * Pure reimplementation of `Accès Invités.Statut de l'accés`:
 *   =IF(AND([ID Réservation].[Date Début]<=TODAY(), [ID Réservation].[Date Fin]>=TODAY()),
 *       "Valide", "expiré")
 */
export function computeAccessStatus(params: { dateDebut: Date; dateFin: Date; now: Date }): "VALIDE" | "EXPIRE" {
  const { dateDebut, dateFin, now } = params;
  return dateDebut <= now && dateFin >= now ? "VALIDE" : "EXPIRE";
}
