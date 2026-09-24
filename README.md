# KasrEvent

A real, coded rebuild of **KasrEvent 🏰**, an event/wedding-hall booking and management
platform originally built as a no-code AppSheet app. This repository replaces the AppSheet
app with a TypeScript backend (Express + PostgreSQL via Prisma), a React web dashboard, and
a **native Flutter mobile app** (Android/iOS), reproducing the original's data model,
business logic, and permission model — see
[docs/APP_MIGRATION_STATUS.md](docs/APP_MIGRATION_STATUS.md) for exactly what maps to what,
and [docs/ASSUMPTIONS.md](docs/ASSUMPTIONS.md) for every place a decision had to be made
because the original wasn't fully documented.

## Stack

- **Backend**: Node.js, TypeScript, Express, Prisma ORM, PostgreSQL, JWT auth, Zod validation
- **Web dashboard**: React, TypeScript, Vite, Tailwind CSS, React Query, React Router
- **Mobile app**: Flutter/Dart (Android + iOS), Provider, Dio, `mobile_scanner` for QR check-in
- **Testing**: Vitest (backend), `flutter test` (mobile)

## Repository layout

```
backend/    Express API, Prisma schema & migrations, tests, CSV data-migration script
frontend/   React web dashboard (Vite) — browser-based back-office
mobile/     Flutter native app (Android/iOS) — the actual "app"
docs/       Architecture, database, API, assumptions, migration status, deployment, mobile
docker-compose.yml   Local PostgreSQL for development
```

## Quick start (local development)

1. **Start PostgreSQL** (or point `DATABASE_URL` at your own instance):
   ```bash
   docker compose up -d
   ```
2. **Install dependencies** (root workspace installs both apps):
   ```bash
   npm install
   ```
3. **Configure the backend**:
   ```bash
   cp backend/.env.example backend/.env
   # edit backend/.env if your DB/JWT settings differ from the defaults
   ```
4. **Create the database schema and seed a first Admin account**:
   ```bash
   npm run prisma:migrate
   npm run seed
   ```
   This creates `admin@kasrevent.local` / `Gérant` account `gerant@kasrevent.local`, both
   with the password printed to the console (default `ChangeMe123!` unless
   `SEED_ADMIN_PASSWORD` is set) — **change it immediately in production**.
5. **Run both apps**:
   ```bash
   npm run dev:backend    # http://localhost:4000
   npm run dev:frontend   # http://localhost:5173 (proxies /api to the backend)
   ```
6. Open http://localhost:5173 and log in with the seeded Admin account.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for production builds and deployment, and
[docs/DATABASE.md](docs/DATABASE.md#migrating-real-appsheet-data) for importing the real
KasrEvent data out of Google Sheets.

## Testing & checks

```bash
npm run typecheck:backend
npm run lint:backend
npm run test:backend
npm run typecheck:frontend
npm run build:frontend
```

All of the above pass as of this rebuild (see docs/APP_MIGRATION_STATUS.md for coverage
notes — not every one of the original app's 239 actions has a dedicated automated test;
the core business-logic ones do).

## Mobile app (Flutter, Android & iOS)

`mobile/` is a real native Flutter app (not a website wrapped in a native shell) that talks
to the same backend API. Push to GitHub and the **Build Flutter Android APK** Actions
workflow produces a downloadable, installable `.apk` automatically — no local Android Studio
needed. iOS requires your own Apple Developer account for a real installable build (Apple's
rule, not this project's) — see [docs/MOBILE.md](docs/MOBILE.md) for the full story on both,
including how to point the app at your deployed backend.

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — system design, module boundaries
- [docs/DATABASE.md](docs/DATABASE.md) — schema, and how to migrate the real AppSheet data
- [docs/API.md](docs/API.md) — REST endpoint reference
- [docs/ASSUMPTIONS.md](docs/ASSUMPTIONS.md) — every deviation from the original app, and why
- [docs/APP_MIGRATION_STATUS.md](docs/APP_MIGRATION_STATUS.md) — AppSheet → code mapping table
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — install, configure, build, deploy
- [docs/MOBILE.md](docs/MOBILE.md) — Android/iOS packaging, CI builds, app store signing
