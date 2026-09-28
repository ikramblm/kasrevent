import { Router } from "express";

const router = Router();

/**
 * Hosted so there's a real, stable URL to put in the Google Play Console "Privacy policy"
 * field — Play requires one for any app that collects personal info, which this app does
 * (client/guest/staff names, phone numbers, emails entered by business staff).
 * Contact email is a placeholder — replace SUPPORT_EMAIL_PLACEHOLDER with a real inbox
 * before publishing.
 */
const PRIVACY_HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Politique de confidentialité — KasrEvent</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { font-family: system-ui, -apple-system, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 20px; color: #222; line-height: 1.6; }
  h1 { font-size: 1.6rem; }
  h2 { font-size: 1.15rem; margin-top: 2rem; }
  .updated { color: #777; font-size: 0.9rem; }
</style>
</head>
<body>
<h1>Politique de confidentialité — KasrEvent</h1>
<p class="updated">Dernière mise à jour : 28 septembre 2026</p>

<p>KasrEvent (« l'application ») est une application de gestion de salles de réception et
d'événements, utilisée par le personnel d'entreprises clientes (administrateurs, gérants,
utilisateurs). Cette page explique quelles données sont traitées et comment.</p>

<h2>Données collectées</h2>
<p>L'application traite les catégories de données suivantes, saisies par le personnel de
l'entreprise cliente dans le cadre normal de son activité :</p>
<ul>
  <li><strong>Comptes du personnel</strong> : nom, e-mail, mot de passe (stocké de façon
  chiffrée, jamais en clair), rôle.</li>
  <li><strong>Informations sur les clients et invités</strong> : nom, prénom, numéro de
  téléphone, e-mail, adresse.</li>
  <li><strong>Informations sur les employés</strong> : nom, rôle, coordonnées, montants de
  salaire dus/versés.</li>
  <li><strong>Données de réservation et financières</strong> : dates, montants à payer,
  avances versées, dettes fournisseurs/traiteurs.</li>
</ul>

<h2>Utilisation des données</h2>
<p>Ces données ne servent qu'au fonctionnement du service : gestion des réservations, des
invités, du personnel et de la comptabilité de l'entreprise cliente. Elles ne sont ni
vendues, ni partagées avec des tiers, ni utilisées à des fins publicitaires. Aucun kit
d'analyse ou de publicité tiers n'est intégré à l'application.</p>

<h2>Stockage et sécurité</h2>
<p>Les données sont stockées dans une base de données hébergée par notre prestataire
d'infrastructure cloud. Les mots de passe sont hachés (bcrypt) et ne sont jamais stockés en
clair. Les échanges entre l'application et le serveur sont chiffrés (HTTPS).</p>

<h2>Conservation et suppression</h2>
<p>Les données sont conservées tant que le compte de l'entreprise cliente reste actif. Pour
toute demande de suppression ou d'export de données, contactez-nous à l'adresse ci-dessous.</p>

<h2>Permissions de l'application</h2>
<p>L'application demande l'accès à la caméra du téléphone, utilisée uniquement pour scanner
les QR codes d'invités lors du contrôle d'accès (check-in). Aucune photo ni vidéo n'est
enregistrée ou transmise via cette permission.</p>

<h2>Enfants</h2>
<p>Cette application est destinée à un usage professionnel par des adultes et n'est pas
conçue pour être utilisée par des enfants.</p>

<h2>Modifications</h2>
<p>Cette politique peut être mise à jour ; la date en haut de page reflète la dernière
révision.</p>

<h2>Contact</h2>
<p>Pour toute question relative à cette politique ou à vos données : <strong>SUPPORT_EMAIL_PLACEHOLDER</strong></p>
</body>
</html>`;

router.get("/privacy", (_req, res) => {
  res.type("html").send(PRIVACY_HTML);
});

export default router;
