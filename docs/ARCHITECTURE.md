# Architecture

## Overview

KasrEvent is a two-tier web application: a stateless REST API (backend) and a single-page
React dashboard (frontend), talking over HTTP/JSON. There is no server-rendering and no
direct database access from the browser — every business rule lives in the backend, which
is the single authoritative enforcement point (unlike the original AppSheet app, where most
rules — including role-based visibility — were client-side only; see
[ASSUMPTIONS.md](ASSUMPTIONS.md)).

```
┌─────────────┐        HTTPS/JSON        ┌──────────────┐        SQL        ┌────────────┐
│  React SPA  │ ───────────────────────▶ │  Express API │ ────────────────▶ │ PostgreSQL │
│  (Vite)     │ ◀─────────────────────── │  (Node/TS)   │ ◀──────────────── │            │
└─────────────┘        JWT bearer        └──────────────┘      Prisma       └────────────┘
```

## Backend (`backend/`)

Organized by **feature module** under `src/modules/<feature>/`, each owning its own routes,
zod validation schemas, and (where the original app had real cross-table logic) a
`*.service.ts` with the business rules:

| Module | Responsibility | Notable business logic |
|---|---|---|
| `auth` | Login, current-user | Rate-limited login, JWT issuance |
| `users` | Admin user management | Password hashing on create/update |
| `clients`, `salles`, `fournisseurs`, `traiteurs`, `decorations` | Reference-data CRUD | Built on `utils/crudFactory.ts` — thin, generic |
| `reservations` | Booking lifecycle | **Double-booking prevention**, close/archive actions |
| `invites` | Guests | QR token generation |
| `checkin` | QR scan | Access-window validation, confiscation cascade |
| `confiscations` | Phone confiscation log | Restitution action |
| `servicesTables` | Catering line items | Total calc, reservation total + caterer debt cascade |
| `charges` | Expense ledger | Supplier/caterer/employee debt adjustment, payroll history logging |
| `employes` | Staff & payroll | Monthly payroll due calculation/run |
| `historiquePaie` | Payroll history | Read-only, populated by `charges` |
| `dashboard` | KPIs | Reproduces the original `Filtre` table's aggregate formulas |
| `demandesReservation`, `reponsesInvitation`, `public` | Public intake | Replaces the original's two Google Forms |
| `adminConfig` | Site settings | Singleton row (WhatsApp/social links) |

Cross-cutting concerns live in `src/middleware/` (auth, RBAC, validation, error handling)
and `src/utils/` (Prisma client singleton, JWT, password hashing, QR generation, the generic
CRUD router factory).

**Why a service layer only for some modules?** Modules whose original AppSheet Actions did
real multi-table work (reservations, charges, services de tables, check-in, employés) get a
dedicated service/business-logic layer. Modules that were just AppSheet's auto-generated
Delete/Edit/Add CRUD (clients, salles, fournisseurs, traiteurs, décorations) are built on the
generic `crudFactory` instead — see [APP_MIGRATION_STATUS.md](APP_MIGRATION_STATUS.md) for
why literally every one of the original's 239 actions did not need its own bespoke handler.

## Frontend (`frontend/`)

- `components/layout/` — the dashboard shell (Sidebar, Header, DashboardLayout). The sidebar
  filters menu items by the signed-in user's role, reproducing the original's view-level
  `Show_If` role gates (see the spec's Views tab / this repo's `docs/ASSUMPTIONS.md`).
- `components/ui/` — small reusable primitives (Card, DataTable with built-in search,
  StatusBadge, Modal, Button, form Field/Input/Select).
- `components/crud/SimpleCrudPage.tsx` — a config-driven CRUD page (table + create modal)
  used by the simpler reference-data pages, to avoid rewriting the same list/create/delete
  boilerplate five times.
- `pages/` — one file per route. `Reservations`/`ReservationDetail` and `CheckIn` are
  hand-built (they encode real workflow, not just CRUD); most others are thin wrappers
  around `SimpleCrudPage`.
- `auth/` — a React context backed by a JWT in `localStorage`, plus `ProtectedRoute` for
  route-level role gating (mirrored by server-side `authorize()` middleware — the frontend
  gate is a UX convenience, not the security boundary).

## Security model

Every write, and every read of non-public data, requires a valid JWT (`authenticate`
middleware). Role checks (`authorize("ADMIN", ...)`) are enforced **server-side** on the
routes that need them, reproducing the original's Admin/Gerant/User tiers — see
[ASSUMPTIONS.md](ASSUMPTIONS.md) for why this is a deliberate, documented improvement over
the source app (which had no table-level Security Filters at all).

## What is intentionally NOT modeled

- AppSheet's 4 navigation "Vue *" tables → became static frontend navigation groupings
  (the Sidebar), not database tables.
- The `Langues` localization table → the app is French-only for now; internationalization
  would be a standard i18n library, not a database table.
- The 26 auto-generated Automation "Process Table"/"Output" artifact tables → these were
  AppSheet implementation detail, not business data; their *behavior* (where it could be
  inferred) is reproduced as real backend logic instead (see APP_MIGRATION_STATUS.md).
