# API Reference

Base URL: `/api`. All routes except `POST /auth/login`, `GET /health`, and `/public/*`
require `Authorization: Bearer <jwt>`. Routes marked **[Admin]** / **[Admin+Gerant]** further
require that role (server-enforced, see `src/middleware/auth.ts`).

## Auth

| Method | Path | Description |
|---|---|---|
| POST | `/auth/login` | `{ email, password }` → `{ token, user }`. Rate-limited (20/15min). |
| GET | `/auth/me` | Current authenticated user. |

## Users **[Admin]**

| Method | Path | Description |
|---|---|---|
| GET | `/users` | List all users. |
| POST | `/users` | Create `{ nom, email, role, telephone?, password }`. |
| PATCH | `/users/:id` | Update `{ nom?, telephone?, role?, password? }`. |
| DELETE | `/users/:id` | Delete (cannot delete yourself). |

## Reference data (Clients, Salles, Fournisseurs, Traiteurs, Décorations)

Standard REST CRUD on each, e.g. for `/clients`:

| Method | Path |
|---|---|
| GET | `/clients` |
| GET | `/clients/:id` |
| POST | `/clients` |
| PATCH | `/clients/:id` |
| DELETE | `/clients/:id` |

Same shape for `/salles`, `/fournisseurs` **[Admin]**, `/traiteurs` **[Admin+Gerant]**,
`/decorations`. `/salles/:id/availability?dateDebut=&dateFin=&excludeReservationId=` returns
`{ available, conflictingReservationId }` — the same check the booking form calls live.

## Reservations

| Method | Path | Description |
|---|---|---|
| GET | `/reservations?statut=&clientId=&salleId=` | List, with computed `resteAPayer`. |
| GET | `/reservations/:id` | Full detail incl. guests, services, invitation link. |
| POST | `/reservations` | Create — rejected with `409` if the room/date range overlaps another. |
| PATCH | `/reservations/:id` | Update — re-validates room availability if dates/room change. |
| DELETE | `/reservations/:id` | Delete. |
| POST | `/reservations/:id/close` | "Clôturer": marks Clôturé, settles the balance. |
| POST | `/reservations/:id/archive?alsoDelete=true` | Snapshots into Archives, optionally deletes. |

## Guests & check-in

| Method | Path | Description |
|---|---|---|
| GET | `/invites?reservationId=` | List guests for a reservation. |
| POST | `/invites` | Add a guest (gets an auto-generated QR token). |
| GET | `/invites/:id/qrcode` | `{ qrCodeDataUrl }` — PNG data URL to display/print. |
| PATCH \| DELETE | `/invites/:id` | Update / remove a guest. |
| POST | `/checkin/scan` | `{ token }` → validates the reservation date window, logs the scan, cascades a phone confiscation if the reservation's policy is on. |
| GET | `/checkin?reservationId=` | Check-in log for a reservation. |

## Confiscations

| Method | Path | Description |
|---|---|---|
| GET | `/confiscations?statut=` | List. |
| POST | `/confiscations` | Manual confiscation entry. |
| POST | `/confiscations/:id/restitute` | Marks returned, stamps the time. |

## Services de Tables (catering line items)

| Method | Path | Description |
|---|---|---|
| GET | `/services-tables?reservationId=` | List for a reservation. |
| POST | `/services-tables` | Creates the line item; also adds its total onto the reservation's balance, the caterer's debt, and any assigned per-day employees' pay — all in one transaction. |

## Charges (expenses) **[Admin+Gerant]**

| Method | Path | Description |
|---|---|---|
| GET | `/charges?type=` | List. |
| POST | `/charges` | Creates the charge and applies the matching debt/payroll side effect (see docs/ASSUMPTIONS.md for the exact rule per `type`). |

## Employés **[Admin]**

| Method | Path | Description |
|---|---|---|
| GET | `/employes` | List. |
| GET | `/employes/:id` | Detail incl. payroll history. |
| POST \| PATCH \| DELETE | `/employes[/:id]` | CRUD. |
| POST | `/employes/run-monthly-payroll` | Runs the "is pay due today" check for all Mensuelle-paid staff and applies it. |

## Historique de paie **[Admin+Gerant]**

| Method | Path | Description |
|---|---|---|
| GET | `/historique-paie?employeId=` | Read-only payroll history. |

## Dashboard **[Admin+Gerant]**

| Method | Path | Description |
|---|---|---|
| GET | `/dashboard?dateDebut=&dateFin=` | KPI numbers (revenue, receivables, charges by category, investments, salary payments) — reproduces the original `Filtre` table's formulas. |

## Public booking intake (no auth)

| Method | Path | Description |
|---|---|---|
| POST | `/public/demande-reservation` | `{ nomPrenom, numeroTelephone, dateDebut?, dateFin?, typeEvenement?, nombreInvites? }` |
| POST | `/public/rsvp/:reservationId` | `{ nomPrenom, numeroTelephone? }` |

## Staff-side intake management

| Method | Path | Description |
|---|---|---|
| GET | `/demandes-reservation` | List booking requests. |
| POST | `/demandes-reservation/:id/enregistrer-client` | Creates a `Client` from the request. |
| POST | `/demandes-reservation/:id/reserver` | `{ clientId, salleId? }` → creates the `Reservation`. |
| GET | `/reponses-invitation?reservationId=` | List RSVPs for a reservation. |
| POST | `/reponses-invitation/:id/confirmer` | Promotes an RSVP into a real guest (`Invite`). |

## Admin config

| Method | Path | Description |
|---|---|---|
| GET | `/admin-config` | Site settings (WhatsApp, social links). |
| PATCH | `/admin-config` **[Admin]** | Update them. |

## Errors

All errors are `{ "error": string, "details"?: unknown }` with a matching HTTP status
(`400` validation, `401` unauthenticated, `403` wrong role, `404` not found, `409` conflict
— e.g. double-booking — `500` unexpected).
