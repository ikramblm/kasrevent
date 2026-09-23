# AppSheet → Code Migration Status

Source: the KasrEvent AppSheet documentation export (55 tables / 994 columns, 4 slices, 121
views, 189 format rules, 239 actions — see the technical specification doc produced earlier
in this project). Update this file as implementation progresses; it should always reflect
reality, not intent.

Legend: ✅ Done · 🟡 Partial / simplified equivalent · ⛔ Not implemented (documented gap)

## Tables → PostgreSQL (Prisma models)

| AppSheet table | Prisma model | Status |
|---|---|---|
| Utilisateurs | `User` | ✅ (password hashed instead of plaintext) |
| _Per User Settings | *(n/a — replaced by JWT session)* | ✅ superseded |
| Clients | `Client` | ✅ |
| Salles | `Salle` | ✅ |
| Réservations | `Reservation` | ✅ incl. double-booking rule |
| Archives de reservations | `ArchiveReservation` | ✅ |
| Invités | `Invite` | ✅ (QR token regenerated, see ASSUMPTIONS #3) |
| Accès Invités | `AccesInvite` | ✅ |
| Confiscations de Téléphones | `ConfiscationTelephone` | ✅ |
| Services de Tables | `ServiceTable` | ✅ |
| Charges | `Charge` | ✅ |
| Fournisseurs | `Fournisseur` | ✅ |
| Traiteurs | `Traiteur` | ✅ |
| Employés | `Employe` | ✅ |
| Historique de Paie | `HistoriquePaie` | ✅ (write-side automatic, see Charges) |
| Décorations | `Decoration` | ✅ |
| Demande de Reservation | `DemandeReservation` | ✅ (Google Form → own public endpoint) |
| Reponses invitations | `ReponseInvitation` | ✅ (Google Form → own public endpoint) |
| Admin | `AdminConfig` | ✅ singleton row |
| Filtre | *(n/a — replaced by `/dashboard` endpoint)* | ✅ superseded |
| Connexion | *(n/a — replaced by `/auth/login` + `LoginEvent`)* | ✅ superseded |
| Vue Gestion d'Entreprise / Administration et Configuration / Gestion des Clients et Invités / Réservations et Événements | Frontend `Sidebar` nav groups | ✅ superseded (not DB tables) |
| Langues | *(n/a)* | ⛔ out of scope — app is French-only for now |
| Photo system | *(n/a)* | ⛔ out of scope — unused simple image lookup |
| Brouillant | *(n/a)* | ⛔ out of scope — looked like an orphaned artifact (see ASSUMPTIONS) |
| 26 Automation Process/Output artifact tables | *(n/a)* | ⛔ out of scope — AppSheet internal bookkeeping, not business data |

## Slices → queries/filters

| AppSheet slice | Code equivalent | Status |
|---|---|---|
| Réservation Non Clôturée | `GET /reservations?statut=EN_ATTENTE,CONFIRMEE` (client-side filter today) | 🟡 works via existing list endpoint; no dedicated `?statut=ne` param yet |
| restitutions | `GET /confiscations?statut=CONFISQUE` | ✅ |
| Événement à venir | Dashboard "Prochain évènement" card (client-side filter on `/reservations`) | ✅ |
| Contacter | `GET /users` (Admin-only; original slice was broader-access) | 🟡 access narrowed to Admin — see ASSUMPTIONS if a broader "contact list" view is needed |

## Views (121) → React routes

Most of the original's views were AppSheet's auto-generated Detail/Form/Inline scaffolding
around a single table — those collapse into this rebuild's generic list+modal pattern
(`SimpleCrudPage`) or the dedicated `Reservations`/`ReservationDetail` pages, not 121
separate screens.

| Category | Original count | Code equivalent | Status |
|---|---|---|---|
| Main menu views | 24 | `Sidebar` nav + one page per item | ✅ all reachable |
| System (Assistant, Settings) | 2 | Not reproduced — no free-text search-everything view, no per-user settings form | ⛔ |
| Dashboards / charts (statistiques, graph *, Filtre par Date, Total) | 7 | `/` Dashboard KPI cards (numbers, not charts) | 🟡 numbers ✅, chart visualizations ⛔ |
| Gallery hubs (Vue * tables) | 5 | `Sidebar` section grouping | ✅ superseded |
| Login / Contacter / Restituer / photos system | 4 | `/login`, `/utilisateurs` (Admin), `/confiscations`, ⛔ | 🟡 |
| Auto-generated Detail/Form/Inline | 79 | `SimpleCrudPage` modal (create) + `DataTable` (list/browse); no dedicated read-only "Detail" page per row for reference tables | 🟡 |

`ReservationDetail` is the one hand-built "Detail"-style view, since it's the only table with
real nested workflow (guests, QR, check-in log, close/archive).

## Format rules (189) → UI behavior

Not modeled as a separate backend concept — a "format rule" in AppSheet is purely
presentational (conditional color/icon), so it maps to plain frontend conditional styling:

| Pattern | Code equivalent | Status |
|---|---|---|
| Status-based color/icon (e.g. `Statut = "Confirmée"` → green) | `components/ui/StatusBadge.tsx` | ✅ covers Réservations/Invités/Accès Invités/Confiscations statuses |
| Role-based name highlighting (e.g. Employés by `Rôle`) | ⛔ not reproduced | Cosmetic-only in the original; skipped |
| Action-button coloring (red Delete, orange Edit, …) | Tailwind `Button` variants (`danger`/`secondary`/`primary`) | ✅ same visual language, not rule-by-rule |
| Dashboard tile coloring (Filtre table) | `KpiCard` `tone` prop | ✅ |

## Actions (239) → coded behavior

| Category | Approx. count | Code equivalent | Status |
|---|---|---|---|
| Delete / Edit / Add (auto per table) | ~85 | Standard REST `DELETE`/`PATCH`/`POST` + frontend modal/table | ✅ |
| Call / SMS / Email (auto per Phone/Email column) | ~25 | `tel:` / `sms:` / `mailto:` links in the frontend (not built as buttons yet in the simpler CRUD pages) | 🟡 backend has the phone numbers; frontend `tel:` links not yet wired on every page |
| View Ref navigation (auto per Ref column) | ~30 | React Router links / `Link to=".../:id"` | 🟡 wired where the UI has a detail page (Reservations); generic Ref-navigation for every table not built |
| Map / URL / static links | ~12 | Plain `<a href>` | 🟡 backend stores the URLs; not all rendered as clickable links yet |
| **Clôturer** | 1 | `POST /reservations/:id/close` | ✅ |
| **Archiv / Archiver et supprimer** | 2 | `POST /reservations/:id/archive` | ✅ |
| **Ajouter Total service a reservation** | 1 | `servicesTables` create transaction | ✅ |
| **ajout de dette / Diminuer la dette (×2, Fournisseur+Traiteur)** | 4 | `charges.service.ts` | ✅ (bug-fixed, see ASSUMPTIONS #4) |
| **Ajouter Paie Mensuelle / Enregistrer la date de paiement** | 2 | `POST /employes/run-monthly-payroll` | ✅ (Admin-triggered, not cron — see ASSUMPTIONS #7) |
| **Ajouter Paie Par jour** | 1 | `servicesTables` create transaction | ✅ |
| **Paiement salaire / Action for Creation de Row** | 2 | `charges.service.ts` (decrements owed + logs `HistoriquePaie`) | ✅ |
| **Heure d'entrée / heure d'entrée accès** (QR check-in) | 2 | `POST /checkin/scan` | ✅ |
| **ajouter la confiscation / ajouter confiscation / confisquer / groupe confiscation** | 4 | `POST /checkin/scan` cascade | ✅ |
| **Restitution** | 1 | `POST /confiscations/:id/restitute` | ✅ |
| **Réserver / Enregistrer Client / Reservation / Voir Client** (Demande de Reservation) | 4 | `demandesReservation` module | ✅ |
| **Confirmer l'invité** | 1 | `reponsesInvitation` module | ✅ |
| **Créer facture** | 1 | Flag only (`Reservation.creerFacture`) | 🟡 no PDF generated (see ASSUMPTIONS #8) |
| **5 "…pdf" document-generation Automations** | — | — | ⛔ not implemented (see ASSUMPTIONS #8) |
| Chart-navigation / LINKTOFILTEREDVIEW actions (Filtre dashboard) | ~15 | `/dashboard` KPI numbers; no drill-through filtered list view yet | ⛔ |
| Home/"Vue" tile generic link-or-view dispatcher | ~15 | `Sidebar` static nav | ✅ superseded (simpler as real routes) |

## Expressions/formulas → code

Every formula that defines real business logic has a coded, commented equivalent (see
`backend/src/modules/*/**.service.ts` and the pure-logic files
`employes/payroll.ts`, `checkin/access-window.ts`, `reservations/reservations.service.ts`).
Purely cosmetic/display formulas (dashboard tile captions, section headers, GIF embeds) were
not reproduced — they carried no business meaning.

## Testing coverage

| Area | Test file | Type |
|---|---|---|
| Password hashing | `tests/password.test.ts` | Unit |
| JWT sign/verify | `tests/jwt.test.ts` | Unit |
| Monthly payroll due-date logic | `tests/payroll.test.ts` | Unit |
| QR check-in access window | `tests/access-window.test.ts` | Unit |
| Double-booking prevention | `tests/reservations.availability.test.ts` | Unit (mocked Prisma) |

Not yet covered by automated tests: end-to-end API integration tests against a real
database, and any frontend component/e2e tests. Recommended next step: add
`supertest`-based integration tests (the dependency is already installed) once a test
database is available in CI.
