# Deployment

## Quick path: Railway (recommended for a first deploy)

The fastest way to get the backend live with zero server management:

1. **Sign up / log in** at [railway.app](https://railway.app) with your GitHub account.
2. **New Project → Deploy from GitHub repo** → pick your `kasrevent` repo.
3. On the service Railway creates, open **Settings → Root Directory** and set it to
   `backend` (this repo is a monorepo; the backend is self-contained under `backend/`, so
   this is enough — no other monorepo config needed).
4. **+ New → Database → Add PostgreSQL** in the same project. Railway provisions it and
   exposes its connection details as variables on the Postgres service.
5. On the **backend service's Variables** tab, add:
   - `DATABASE_URL` → click "Add Reference" and point it at the Postgres service's
     `DATABASE_URL` (keeps them in sync automatically instead of copy-pasting).
   - `JWT_SECRET` → a long random string (e.g. generate one with `openssl rand -hex 32`).
   - `NODE_ENV` → `production`
   - `CORS_ORIGIN` → your web dashboard's URL once you have one deployed, or `*` for now if
     you're only testing the mobile app first (tighten this before going live for real).
   - `PUBLIC_APP_URL` → same as above for now.
   - `BCRYPT_SALT_ROUNDS` → `12`
   - `SEED_ADMIN_PASSWORD` → a real password for the seeded Admin account.

   (`PORT` doesn't need setting — Railway injects it, and the app already reads
   `process.env.PORT`.)
6. Railway auto-detects Node, runs `npm install` (which also runs `prisma generate` via the
   `postinstall` script), then `npm run build`, then `npm start`. Watch the **Deployments**
   tab for the first build to finish.
7. **Create the database schema** — this project has no committed Prisma migrations yet (no
   database was available while building it), so use `prisma db push` for the first sync
   instead of `prisma migrate deploy` (which would find no migrations to apply and do
   nothing, leaving you with empty tables). Install the [Railway
   CLI](https://docs.railway.com/guides/cli) locally, then:
   ```bash
   railway login
   railway link   # pick this project
   railway run --service <backend-service-name> npm run prisma:push --workspace backend
   railway run --service <backend-service-name> npm run seed --workspace backend
   ```
   (Once the schema is stable, switch to real migrations — see "Database" below.)
8. **Settings → Networking → Generate Domain** on the backend service to get its public
   URL. That URL + `/api` is what you set as `VITE_API_BASE_URL` (web) and `API_BASE_URL`
   (mobile, as a GitHub Actions repository variable — see docs/MOBILE.md).
9. Log in at `<your-domain>/api/health` in a browser first — you should see
   `{"status":"ok"}` — before wiring up the frontend/mobile app, to confirm the deploy
   actually worked.

Any other Node-friendly host (Render, Fly.io, a plain VPS) works too — the steps below are
the platform-agnostic version of the same process.

## Prerequisites

- Node.js 20+ and npm
- A PostgreSQL 14+ database (managed service, or `docker-compose.yml` for self-hosting)

## 1. Install

```bash
npm install
```

## 2. Configure

```bash
cp backend/.env.example backend/.env
```

Set at minimum in `backend/.env`:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Long random string — **must** be changed from the placeholder in production |
| `CORS_ORIGIN` | The deployed frontend's origin |
| `PUBLIC_APP_URL` | The deployed frontend's public URL (used to build QR check-in links and the RSVP link) |
| `BCRYPT_SALT_ROUNDS` | 12 is a reasonable default; raise if your hardware allows |

The frontend has no required environment configuration for a standard deployment where it
is served from the same origin the API is proxied from; if the API is on a different origin
in production, update `frontend/vite.config.ts`'s proxy or add an API base URL env var and
use it in `frontend/src/api/client.ts`.

## 3. Database

If you have a local/self-hosted Postgres you control fully (e.g. via `docker-compose.yml`):

```bash
npm run prisma:migrate --workspace backend   # first deploy: creates the schema + a migration file
# in CI/CD for subsequent deploys, once migrations exist:
npm run --workspace backend prisma:deploy    # applies committed migrations, non-interactive
npm run seed --workspace backend             # optional: creates a first Admin account
```

Against a **managed/hosted Postgres** (Railway, Render, RDS, …) where you may not have
permission to create the shadow database `prisma migrate dev` needs, use `db push` instead
for now (no migration history, but no shadow-DB permission issues either):

```bash
npm run prisma:push --workspace backend
npm run seed --workspace backend
```

Set `SEED_ADMIN_PASSWORD` before seeding in any real environment — otherwise the default
placeholder password is used and **must** be changed immediately after first login.

## 4. Build

```bash
npm run build:backend    # → backend/dist
npm run build:frontend   # → frontend/dist (static assets)
```

## 5. Run

```bash
node backend/dist/index.js
```

Serve `frontend/dist` from any static host (Nginx, a CDN, or a platform's static-site
hosting) with `/api/*` reverse-proxied to the backend process. A minimal Nginx example:

```nginx
server {
  listen 80;
  root /var/www/kasrevent/frontend-dist;
  try_files $uri /index.html;

  location /api/ {
    proxy_pass http://127.0.0.1:4000;
    proxy_set_header Host $host;
  }
}
```

## 6. Process management

Run the backend under a process manager (systemd, pm2, or your platform's equivalent) so it
restarts on crash/reboot:

```bash
pm2 start backend/dist/index.js --name kasrevent-api
```

## Data migration

See [DATABASE.md](DATABASE.md#migrating-real-appsheet-data) to import the real KasrEvent
data from the original Google Sheet once you're ready to cut over.

## Checklist before going live

- [ ] `JWT_SECRET` changed from the placeholder
- [ ] `SEED_ADMIN_PASSWORD` set (or the seeded admin's password changed via the Users page)
- [ ] `CORS_ORIGIN` / `PUBLIC_APP_URL` point at the real production frontend URL
- [ ] Database backups configured (this app has no built-in backup mechanism)
- [ ] HTTPS terminated in front of both the frontend and the API (never run either over
      plain HTTP in production — JWTs and guest phone numbers/PII would be exposed)
- [ ] Real AppSheet data imported (docs/DATABASE.md) and imported users' passwords reset
