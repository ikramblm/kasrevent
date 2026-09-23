/**
 * One-off data migration: imports the ORIGINAL AppSheet Google Sheet data (exported to CSV,
 * one file per worksheet/table) into this app's PostgreSQL database. Run once per legacy
 * dataset; safe to re-run (every insert is an upsert keyed on the original row id).
 *
 * The original app's Google Sheet is NOT touched and does not need to stay connected —
 * this only reads local CSV files you export ahead of time.
 *
 * Usage:
 *   1. In Google Sheets, File → Download → Comma Separated Values (.csv), once per tab,
 *      keeping the ORIGINAL tab name as the filename (e.g. "Réservations.csv").
 *   2. Put all exported CSVs in one folder, e.g. backend/csv-export/.
 *   3. DATABASE_URL=... CSV_DIR=./csv-export npm run migrate:csv --workspace backend
 *
 * Only the 10 core business tables are mapped below (the ones that define KasrEvent's data
 * model — see docs/APP_MIGRATION_STATUS.md). Secondary/history tables (Accès Invités,
 * Confiscations de Téléphones, Services de Tables, Historique de Paie, Archives de
 * reservations, Demande de Reservation, Reponses invitations, Admin) are NOT pre-wired
 * because they are operational history that is fine to start empty in production — extend
 * the `MIGRATIONS` array below with the same pattern if you need to backfill them too.
 */
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/password";

const prisma = new PrismaClient();
const CSV_DIR = process.env.CSV_DIR ?? path.join(__dirname, "..", "csv-export");

function readCsv(fileName: string): Record<string, string>[] {
  const filePath = path.join(CSV_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠ Skipping ${fileName} — file not found in ${CSV_DIR}`);
    return [];
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return parse(raw, { columns: true, skip_empty_lines: true, trim: true });
}

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function parseNumber(value?: string): number | undefined {
  if (!value) return undefined;
  const n = Number(value.replace(/[^0-9.,-]/g, "").replace(",", "."));
  return Number.isNaN(n) ? undefined : n;
}

const ROLE_MAP: Record<string, "ADMIN" | "GERANT" | "USER"> = { Admin: "ADMIN", Gerant: "GERANT", User: "USER" };
const STATUT_RESERVATION_MAP: Record<string, "EN_ATTENTE" | "CONFIRMEE" | "ANNULEE" | "CLOTURE"> = {
  "En attente": "EN_ATTENTE",
  Confirmée: "CONFIRMEE",
  Annulée: "ANNULEE",
  Clôturé: "CLOTURE"
};
const TYPE_EVENEMENT_MAP: Record<string, "MARIAGE" | "SEMINAIRE" | "ANNIVERSAIRE" | "EVENEMENT" | "AUTRE"> = {
  Mariage: "MARIAGE",
  Séminaire: "SEMINAIRE",
  Anniversaire: "ANNIVERSAIRE",
  Évènement: "EVENEMENT"
};
const TYPE_CHARGE_MAP: Record<string, string> = {
  Achat: "ACHAT",
  Approvisionnement: "APPROVISIONNEMENT",
  "Paiement salaire": "PAIEMENT_SALAIRE",
  "Paiement Dettes Fournisseurs": "PAIEMENT_DETTES_FOURNISSEURS",
  "Paiement Dettes Traiteurs": "PAIEMENT_DETTES_TRAITEURS",
  "Paiement Factures": "PAIEMENT_FACTURES",
  Investissement: "INVESTISSEMENT",
  Réparation: "REPARATION"
};
const METHODE_PAIEMENT_MAP: Record<string, "ESPECE" | "CHEQUE" | "VIREMENT"> = {
  Espèce: "ESPECE",
  Chèque: "CHEQUE",
  Virement: "VIREMENT"
};
const TYPE_DECORATION_MAP: Record<string, string> = {
  Fleurs: "FLEURS",
  Tapis: "TAPIS",
  Chaises: "CHAISES",
  Tables: "TABLES",
  Sculpture: "SCULPTURE"
};

async function migrateUtilisateurs() {
  const rows = readCsv("Utilisateurs.csv");
  for (const row of rows) {
    await prisma.user.upsert({
      where: { id: row["ID Utilisateur"] },
      update: {},
      create: {
        id: row["ID Utilisateur"],
        nom: row["Nom Utilisateur"] || "Utilisateur",
        role: ROLE_MAP[row["Rôle"]] ?? "USER",
        telephone: row["Telephone"] || undefined,
        // Google Sheets export has no reliable unique email in some legacy rows; fall back
        // to a synthetic placeholder so the (required, unique) email column is always filled.
        email: row["Email"] || `${row["ID Utilisateur"]}@import.kasrevent.local`,
        // The original stored passwords in plain text (see docs/ASSUMPTIONS.md) — imported
        // accounts get a random one-time password instead and MUST reset it after go-live.
        passwordHash: await hashPassword(row["Mot de passe"] || row["ID Utilisateur"])
      }
    });
  }
  console.log(`Utilisateurs: ${rows.length} imported`);
}

async function migrateClients() {
  const rows = readCsv("Clients.csv");
  for (const row of rows) {
    await prisma.client.upsert({
      where: { id: row["ID_Client"] },
      update: {},
      create: {
        id: row["ID_Client"],
        nom: row["Nom"] || "—",
        prenom: row["Prénom"] || undefined,
        telephone: row["Téléphone"] || undefined,
        email: row["Email"] || undefined,
        adresse: row["Adresse"] || undefined,
        utilisateurId: row["Utilisateur"] || undefined
      }
    });
  }
  console.log(`Clients: ${rows.length} imported`);
}

async function migrateSalles() {
  const rows = readCsv("Salles.csv");
  for (const row of rows) {
    await prisma.salle.upsert({
      where: { id: row["ID Salle"] },
      update: {},
      create: {
        id: row["ID Salle"],
        nom: row["Nom Salle"] || "Salle",
        localisation: row["Localisation"] || undefined,
        lienLocalisation: row["Lien Localisation"] || undefined,
        capacite: parseNumber(row["Capacité"]),
        tarif: parseNumber(row["Tarifs"]),
        equipementsInclus: row["Équipements Inclus"] ? row["Équipements Inclus"].split(",").map((s) => s.trim()) : [],
        photo: row["Photo"] || undefined,
        utilisateurId: row["Utilisateur"] || undefined
      }
    });
  }
  console.log(`Salles: ${rows.length} imported`);
}

async function migrateFournisseurs() {
  const rows = readCsv("Fournisseurs.csv");
  for (const row of rows) {
    await prisma.fournisseur.upsert({
      where: { id: row["Fournisseur Id"] },
      update: {},
      create: {
        id: row["Fournisseur Id"],
        company: row["Company"] || row["Nom"] || "Fournisseur",
        nom: row["Nom"] || undefined,
        tel: row["Tel"] || undefined,
        adresse: row["Adresse"] || undefined,
        logo: row["Logo"] || undefined,
        dettes: parseNumber(row["Dettes Fournisseur"]) ?? 0
      }
    });
  }
  console.log(`Fournisseurs: ${rows.length} imported`);
}

async function migrateTraiteurs() {
  const rows = readCsv("Traiteurs.csv");
  for (const row of rows) {
    await prisma.traiteur.upsert({
      where: { id: row["ID Traiteur"] },
      update: {},
      create: {
        id: row["ID Traiteur"],
        nom: row["Nom"] || "Traiteur",
        specialite: row["Spécialité"] ? row["Spécialité"].split(",").map((s) => s.trim()) : [],
        contact: row["Contact"] || undefined,
        telephone: row["Téléphone"] || undefined,
        adresse: row["Adresse"] || undefined,
        tarifs: parseNumber(row["Tarifs"]),
        dettes: parseNumber(row["Dettes Traiteur"]) ?? 0,
        photo: row["photo"] || undefined,
        siteWeb: row["Site web"] || undefined,
        utilisateurId: row["Utilisateur"] || undefined
      }
    });
  }
  console.log(`Traiteurs: ${rows.length} imported`);
}

async function migrateEmployes() {
  const rows = readCsv("Employés.csv");
  for (const row of rows) {
    await prisma.employe.upsert({
      where: { id: row["ID Employé"] },
      update: {},
      create: {
        id: row["ID Employé"],
        nom: row["Nom"] || "Employé",
        prenom: row["Prénom"] || undefined,
        role: row["Rôle"] || "Autre",
        telephone: row["Téléphone"] || undefined,
        email: row["Email"] || undefined,
        disponibilite: row["Disponibilité"] !== "Non",
        typePaie: row["type de paie"] === "Journalière" ? "JOURNALIERE" : "MENSUELLE",
        paieMensuelle: parseNumber(row["Paie Mensuelle"]),
        paieParJour: parseNumber(row["Paie Par Jour"]),
        montantAPayer: parseNumber(row["Montant à Payer"]) ?? 0,
        jourDePaie: parseNumber(row["Jour de paie"]),
        derniereDatePaie: parseDate(row["Dernière Date de Paie"]),
        utilisateurId: row["Utilisateur"] || undefined
      }
    });
  }
  console.log(`Employés: ${rows.length} imported`);
}

async function migrateDecorations() {
  const rows = readCsv("Décorations.csv");
  for (const row of rows) {
    await prisma.decoration.upsert({
      where: { id: row["ID Décor"] },
      update: {},
      create: {
        id: row["ID Décor"],
        nom: row["Nom Décor"] || "Décoration",
        type: (TYPE_DECORATION_MAP[row["Type"]] ?? "TABLES") as any,
        stockDisponible: parseNumber(row["Stock Disponible"]),
        prixLocation: parseNumber(row["Prix Location"]),
        utilisateurId: row["Utilisateur"] || undefined
      }
    });
  }
  console.log(`Décorations: ${rows.length} imported`);
}

async function migrateReservations() {
  const rows = readCsv("Réservations.csv");
  for (const row of rows) {
    const dateDebut = parseDate(row["Date Début"]) ?? new Date();
    await prisma.reservation.upsert({
      where: { id: row["ID_Réservation"] },
      update: {},
      create: {
        id: row["ID_Réservation"],
        clientId: row["Client"],
        salleId: row["ID_Salle"] || undefined,
        dateDebut,
        dateFin: parseDate(row["Date Fin"]) ?? dateDebut,
        typeEvenement: (TYPE_EVENEMENT_MAP[row["Type Événement"]] ?? "AUTRE") as any,
        nombreInvites: parseNumber(row["Nombre_Invités"]) ?? 0,
        statut: (STATUT_RESERVATION_MAP[row["Statut"]] ?? "EN_ATTENTE") as any,
        note: row["Note"] || undefined,
        confiscationPolicy: row["Confiscation"] === "Oui",
        totalAPayer: parseNumber(row["Total a Payer"]) ?? 0,
        avanceVersee: parseNumber(row["Avance Versée"]) ?? 0,
        creerFacture: row["Créer facture"] === "Oui",
        utilisateurId: row["Utilisateur"] || undefined
      }
    });
  }
  console.log(`Réservations: ${rows.length} imported`);
}

async function migrateInvites() {
  const rows = readCsv("Invités.csv");
  for (const row of rows) {
    await prisma.invite.upsert({
      where: { id: row["ID Invité"] },
      update: {},
      create: {
        id: row["ID Invité"],
        reservationId: row["ID Réservation"],
        nom: row["Nom"] || "Invité",
        prenom: row["Prénom"] || undefined,
        telephone: row["Téléphone"] || undefined,
        statut: row["Statut"] === "Confirmé" ? "CONFIRME" : "NON_CONFIRME",
        heureEntree: parseDate(row["Heure Entrée"]),
        heureSortie: parseDate(row["Heure Sortie"])
        // qrCodeToken is intentionally NOT imported from the old `QR Code` column (that
        // encoded the guest's plain row id) — a fresh random token is generated instead
        // (default(uuid()) in the schema) so old, possibly-shared QR images stop working.
      }
    });
  }
  console.log(`Invités: ${rows.length} imported`);
}

async function migrateCharges() {
  const rows = readCsv("Charges.csv");
  for (const row of rows) {
    const mappedType = TYPE_CHARGE_MAP[row["Type"]] ?? "AUTRE";
    await prisma.charge.upsert({
      where: { id: row["ID Charge"] },
      update: {},
      create: {
        id: row["ID Charge"],
        type: mappedType as any,
        fournisseurId: row["Fournisseur"] || undefined,
        traiteurId: row["Traiteur"] || undefined,
        employeId: row["Employé"] || undefined,
        moisPaye: row["Mois Payé"] || undefined,
        montantTotal: parseNumber(row["Montant Total"]) ?? 0,
        methodePaiement: (METHODE_PAIEMENT_MAP[row["Methode de Paiement"]] ?? "ESPECE") as any,
        montantPaye: parseNumber(row["Montant Payé"]) ?? 0,
        description: row["Description"] || undefined,
        photo: row["Photo"] || undefined,
        dateHeure: parseDate(row["Date heure"]) ?? new Date(),
        utilisateurId: row["Utilisateur"] || undefined
      }
    });
  }
  console.log(`Charges: ${rows.length} imported`);
}

async function main() {
  console.log(`Reading CSVs from: ${CSV_DIR}`);
  // Order matters: referenced tables (Users, Clients, Salles, Fournisseurs, Traiteurs,
  // Employés) must be imported before the tables that reference them (Réservations,
  // Invités, Charges).
  await migrateUtilisateurs();
  await migrateClients();
  await migrateSalles();
  await migrateFournisseurs();
  await migrateTraiteurs();
  await migrateEmployes();
  await migrateDecorations();
  await migrateReservations();
  await migrateInvites();
  await migrateCharges();
  console.log("✅ Migration complete.");
}

main()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
