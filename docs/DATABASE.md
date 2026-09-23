# Database

PostgreSQL, managed with [Prisma](https://www.prisma.io) (`backend/prisma/schema.prisma`).

## Schema summary

| Model | Reproduces AppSheet table | Notes |
|---|---|---|
| `User` | Utilisateurs | `passwordHash` (bcrypt) replaces the plaintext `Mot de passe` |
| `LoginEvent` | *(new)* | Login audit log — the original had no equivalent |
| `Client` | Clients | |
| `Salle` | Salles | `equipementsInclus` is a Postgres text array (was an EnumList) |
| `Reservation` | Réservations | Central table; `resteAPayer` is computed at read time, not stored |
| `ArchiveReservation` | Archives de reservations | Snapshot created by the archive action |
| `Invite` | Invités | `qrCodeToken` (random UUID) replaces the original's exposed row-id-based QR |
| `AccesInvite` | Accès Invités | One row per check-in scan attempt |
| `ConfiscationTelephone` | Confiscations de Téléphones | |
| `ServiceTable` | Services de Tables | `employeIds` is a string array (was an EnumList of Ref) |
| `Fournisseur` | Fournisseurs | |
| `Traiteur` | Traiteurs | |
| `Employe` | Employés | |
| `HistoriquePaie` | Historique de Paie | Populated automatically by a `PAIEMENT_SALAIRE` Charge |
| `Charge` | Charges | |
| `Decoration` | Décorations | |
| `DemandeReservation` | Demande de Reservation | Was a Google Form response sheet |
| `ReponseInvitation` | Reponses invitations | Was a second Google Form response sheet |
| `AdminConfig` | Admin | Singleton row (`id = "singleton"`) |

**Not modeled as tables** (see docs/ARCHITECTURE.md): the 4 "Vue *" navigation tables, the
`Langues` localization table, `Photo system`, the orphaned `Brouillant` table, and the 26
auto-generated Automation Process/Output artifact tables.

Enums (`Role`, `StatutReservation`, `TypeCharge`, …) replace the original's AppSheet Enum
columns; French option labels are mapped to `UPPER_SNAKE_CASE` values (see the migration
script's `*_MAP` constants for the exact French↔code mapping used on import).

## Running migrations

```bash
npm run prisma:migrate --workspace backend   # dev: creates/updates the DB + a migration file
npm run prisma:deploy --workspace backend    # prod: applies existing migrations, no prompts
```

## Migrating real AppSheet data

The original data lives in a Google Sheet ("Salle des Fetes", one worksheet per table) and
does **not** need to stay connected to this app — `backend/scripts/migrate-from-csv.ts`
imports a one-time CSV export instead:

1. In Google Sheets: **File → Download → Comma Separated Values (.csv)**, once per relevant
   tab, keeping the **original tab name** as the filename (accents included), e.g.
   `Réservations.csv`, `Clients.csv`, `Utilisateurs.csv`.
2. Put them all in one folder, e.g. `backend/csv-export/`.
3. Run:
   ```bash
   CSV_DIR=./csv-export npm run migrate:csv --workspace backend
   ```

The script imports, in dependency order, `Utilisateurs → Clients → Salles → Fournisseurs →
Traiteurs → Employés → Décorations → Réservations → Invités → Charges`, upserting on the
**original row id** (so re-running it is safe, and existing foreign keys — e.g.
`Réservations.Client` pointing at a `Clients` row id — resolve correctly without an id
remapping step).

Tables not covered by the script (Accès Invités history, Confiscations de Téléphones,
Services de Tables, Historique de Paie, Archives de reservations, Demande de Reservation,
Reponses invitations, Admin) are pure operational history/config that is safe to start
empty; extend the script with the same `readCsv` + `prisma.<model>.upsert` pattern if you
need to backfill them too (see the file's top comment).

**Imported user passwords**: the original stored plaintext passwords, which this app never
persists in plaintext — imported accounts instead get a one-time password derived from
their old password (hashed, never stored raw) and **must** be reset via the Users page
before real use. See [ASSUMPTIONS.md](ASSUMPTIONS.md).
