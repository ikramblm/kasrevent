# Deployment

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

```bash
npm run prisma:migrate --workspace backend   # first deploy: creates the schema
# or, in CI/CD for subsequent deploys:
npm run --workspace backend prisma:deploy    # applies committed migrations, non-interactive
npm run seed --workspace backend             # optional: creates a first Admin account
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
