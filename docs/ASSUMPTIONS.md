# Assumptions & deliberate deviations from the original app

The original KasrEvent AppSheet app was analyzed from its auto-generated HTML
documentation export only (no access to the live app, its Google Sheet data, or its
Automation/Bot step definitions — see the technical specification doc produced earlier in
this project). Every place this rebuild had to guess, fill a gap, or knowingly diverge from
the original is listed here.

## Security (deliberate improvements, not bugs)

1. **Passwords are hashed (bcrypt), never plaintext.** The original stored
   `Utilisateurs.Mot de passe` as plain `Text` (`IsSensitive = No`) and its `Connexion`
   login table did a plaintext `=` comparison, with no rate-limiting or lockout. This
   rebuild hashes on write and compares with `bcrypt.compare`, and rate-limits `/auth/login`
   (20 attempts / 15 min / IP). **This is an intentional behavior change, not a bug** — the
   original behavior must not be reproduced.
2. **Role checks are enforced server-side**, not just hidden in the UI. The original's
   Admin/Gerant/User tiers were implemented purely as view-level `Show_If` expressions —
   nothing stopped a user from reaching restricted data via a direct link/API call, since no
   table-level Security Filter existed anywhere in the export. This rebuild's `authorize()`
   middleware enforces the same tiers on every relevant route.
3. **QR codes encode an opaque random token**, not the guest's real row id. The original
   generated guest QR images via a public `quickchart.io` call embedding the guest's plain
   database key. This rebuild generates QR images locally (`qrcode` npm package, no
   third-party network call) encoding `Invite.qrCodeToken` (a random UUID unrelated to the
   guest's real id), so a photographed/leaked QR code can't be used to guess or enumerate
   other guest records.

## Business logic where the original's formulas were ambiguous or looked buggy

4. **Debt increase vs. decrease on Fournisseurs/Traiteurs.** The spec's extraction of the
   original's "ajout de dette" and "Diminuer la dette" actions (and their Traiteur
   equivalents) found **the same add-formula in both** — almost certainly a copy-paste bug
   in the source app, not intended behavior. This rebuild implements the evidently-intended
   logic instead (`backend/src/modules/charges/charges.service.ts`):
   - a purchase/investment/supply `Charge` against a `Fournisseur` **increases** its debt by
     the unpaid remainder (`montantTotal - montantPaye`);
   - a `PAIEMENT_DETTES_FOURNISSEURS` / `PAIEMENT_DETTES_TRAITEURS` `Charge` **decreases**
     the corresponding debt by the amount paid.
5. **`Services de Tables.Related Employés`** had a tautological formula in the original
   (`[_THISROW].[ID Service] = [_THISROW].[ID Service]`, always true) — not reproduced;
   this rebuild's `employeIds` field is a plain assigned-staff list instead.
6. **Duplicated debt-adjustment logic (Actions *and* Automations).** The original appears to
   run the same debt-adjustment logic twice — once as a client-triggered Action, once as a
   server-side Bot (inferred from matching artifact tables) — which risks double-counting.
   This rebuild implements it exactly **once**, inside the relevant API transaction
   (`servicesTables` / `charges` modules), which is the closest safe equivalent.

## Gaps filled with a reasonable default (Automations/Bots were not exported)

The original export's documentation format does not include actual Bot/Automation step
definitions (trigger condition, ordered steps, document templates) — only the artifact
tables AppSheet leaves behind. For every inferred Automation, this rebuild implements the
evident *outcome* as ordinary backend logic rather than a scheduled background job:

7. **Monthly payroll** ("Paie mensuelle" bot) is exposed as an Admin-triggered endpoint
   (`POST /employes/run-monthly-payroll`) rather than an automatic daily cron, since the
   original's actual trigger schedule is unknown. Wire it to a scheduler (cron, a hosting
   platform's scheduled job) if unattended daily execution is wanted.
8. **The five "…pdf" document-generation automations** (booking confirmation, closing
   statement, invoice, guest pass, reservation report) are **not implemented** — their
   Google Doc templates and exact trigger conditions were never in the export. `Réservations
   .creerFacture` is modeled as a plain flag; wiring it to an actual PDF renderer (e.g.
   Puppeteer + an HTML invoice template, or a templating service) is a follow-up task.
9. **Guest invitation link** originally opened a pre-filled Google Form; there is no
   dependency on Google Forms in this rebuild, so `Réservations.Lien D'invitation` instead
   points at this app's own public `/rsvp/:reservationId` page, which does the same job
   (collect an RSVP) via `POST /public/rsvp/:reservationId`.
10. **The public booking-request intake** (`Demande de Reservation`, was a Google Form)
    is similarly replaced by `POST /public/demande-reservation` and the staff-side
    `/demandes` page — same role, no external dependency.

## Data-model simplifications

11. **`Réservations.Reste a Payer`** is computed at read time (`totalAPayer - avanceVersee`)
    rather than stored, since it is fully derived — avoids it ever drifting out of sync.
12. **The 4 "Vue *" navigation tables, `Langues`, `Photo system`, and `Brouillant`** are not
    modeled as database tables — they were AppSheet UI/editor artifacts (navigation
    groupings, localization strings, a simple image lookup, and what looks like an orphaned
    broken artifact respectively), not business data. See docs/ARCHITECTURE.md.
13. **The 26 Automation Process/Output artifact tables** are not modeled — they were
    AppSheet's internal bookkeeping for its Bots, not user-facing data.
14. **Currency** is assumed to be Algerian Dinar (DA) based on the original formulas'
    literal `" Da"` suffix and the WhatsApp default country code `213` — not explicitly
    confirmed. Amounts are stored as plain `Decimal`; formatting as "DA" is done in the
    frontend only, so switching currency later is a display-layer change.
15. **Enum value mapping** (e.g. `Statut: "En attente"` → `EN_ATTENTE`) uses the French
    labels observed in the spec's Format Rules / Actions tabs. If the live app has
    additional enum values not seen in that export (columns allowed `AllowOtherValues` in
    several places, e.g. `Charges.Type`, `Employés.Rôle`), they will need to be added to the
    relevant Prisma enum before importing data that uses them.

## Explicitly out of scope for this rebuild

See [APP_MIGRATION_STATUS.md](APP_MIGRATION_STATUS.md) for the full per-item mapping, but in
summary: the original's 121 views are not each reproduced as a separate bespoke screen —
most were AppSheet's auto-generated Detail/Form/Inline views around a single table, which a
config-driven CRUD page (or the `Reservations`/`ReservationDetail` pages, for anything with
real workflow) already covers. Likewise, most of the 239 actions were auto-generated
Delete/Edit/Add/Call/SMS/Email/View-Ref navigation helpers with no bespoke logic of their
own — those became standard REST CRUD + frontend routing/`tel:`/`mailto:` links, not 239
individual backend endpoints. Every action that contained **real** cross-table business
logic (debt tracking, payroll, booking validation, check-in, archiving) has a coded
equivalent — see the mapping table for which.
