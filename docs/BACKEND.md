# Backend Guide (RentMyRide)

A practical handbook for backend contributors to work productively without deep-diving through the whole codebase.

## Quick start (5 steps)

1. Create `.env` at repo root:

```
DATABASE_URL_APP=postgresql://app:app@localhost:5432/rentmyride
PORT=5001
TZ=UTC
```

2. Start DB and API (Docker recommended):

```
docker compose -f devops/docker-compose.yml up -d db api
```

3. Sync schema and (optionally) apply DB patches:

```
npx prisma db push --schema=prisma/app.schema.prisma
node prisma/apply-patches.js
```

4. Hit health endpoint: http://localhost:5001/api/health

5. Run tests: `npm test` (from repo root)

## TL;DR: What this is

- Stack: Node.js (ESM) + Express + Prisma (PostgreSQL)
- Active schema: `prisma/app.schema.prisma` with env `DATABASE_URL_APP`
- API base path: `/api/*`
- Health: `GET /api/health`
- Booking lifecycle: request → approve → pay → complete / cancel
- Tests: Jest + Supertest; global coverage gates enabled
- Containers: Docker Compose for API + Postgres; optional Nginx frontend

---

## Repository map (backend-relevant)

- `backend/src/app.js` — Express app wiring, middlewares, health, routes, static serving for built SPA
- `backend/src/server.js` — Entry (starts HTTP server)
- `backend/src/controllers/bookingController.js` — Booking lifecycle + pagination
- `backend/src/controllers/carController.js` — Car endpoints (public + create, mocked in tests)
- `backend/src/routes/bookingRoutes.js` — Booking routes
- `backend/src/routes/carRoutes.js` — Car routes
- `backend/src/middleware/testAuthShim.js` — Lightweight auth shim for tests (reads headers to set `req.user`)
- `backend/src/models/prisma.js` — Centralized Prisma singleton + DI hook for tests
- `prisma/app.schema.prisma` — Active Prisma schema (Postgres)
- `prisma/schema.prisma` — Deprecated legacy schema (intentionally blank)
- `prisma/raw/pg-patches.sql` — DB constraints/indexes not expressible or enforced via ORM alone
- `prisma/apply-patches.js` — Applies the raw SQL patches above (idempotent)
- `scripts/archive-messages.js` — Archive job (messages → messages_archive)
- `scripts/archive-scheduler.js` — Cron-style runner for archive job
- `devops/docker-compose.yml` — API + Postgres (+ optional Nginx frontend)
- `devops/Dockerfile` — Multi-stage: builds frontend + backend; serves SPA from Express
- `devops/Dockerfile.frontend` — Nginx-served SPA image (proxies `/api/*`)
- `devops/nginx.conf` — SPA fallback + API proxy config
- `tests/*.spec.js` — Jest tests (API, controller mocks, DB, archive)

---

## Environment & Setup

- Node.js 20+ recommended.
- PostgreSQL 14+ (compose uses Postgres 16-alpine).
- Required env:
  - `DATABASE_URL_APP` (example: `postgresql://app:app@localhost:5432/rentmyride`)
  - Optional: `PORT` (default 5001), `TZ` for scheduler.

Install dependencies and generate Prisma client:

- From repo root: `npm install` (for root dev tools), then `cd backend && npm install`
- Prisma artifacts are output to `prisma-client-app` by `postinstall` in `backend/package.json`.

Database schema sync options:

- Development (fast): `npx prisma db push --schema=prisma/app.schema.prisma`
- Or use migrations in `prisma/migrations` with `npx prisma migrate dev --schema=prisma/app.schema.prisma`
- Then (optional but recommended) apply DB patches: `node prisma/apply-patches.js`

Seeding (if needed):

- `node prisma/seed-app.js` (verify contents align with active schema)

---

## Where to find things

- API spec and design notes: `docs/` → `API_SPEC.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`, `WORKFLOW.md`
- Database: `prisma/app.schema.prisma`, migrations in `prisma/migrations/`, SQL add-ons in `prisma/raw/pg-patches.sql`
- DevOps: `devops/` (compose + Dockerfiles + nginx)
- Tests: `tests/` (API, controllers, archive job, db)
- Generated Prisma client: `prisma-client-app/`
- Jobs: `scripts/archive-messages.js`, `scripts/archive-scheduler.js`

---

## Running

Local (without Docker):

- Ensure Postgres is running, `DATABASE_URL_APP` is set
- `cd backend && npm start` (starts Express on `PORT` or 5001)
- Health: `GET http://localhost:5001/api/health`

With Docker Compose:

- API + DB only: `docker compose -f devops/docker-compose.yml up -d db api`
- Full stack (Nginx + SPA + API + DB): `docker compose -f devops/docker-compose.yml up -d db api frontend`
  - App: `http://localhost/`
  - API direct: `http://localhost:5001/api/health`

Unified image (Express serves SPA):

- `docker build -f devops/Dockerfile -t rentmyride-unified .`
- `docker run -p 5001:5001 rentmyride-unified`

---

## Middleware & Auth

- `testAuthShim` is used in non-production to simulate an authenticated user.
  - Expects headers like `x-user-id`, `x-user-role` to populate `req.user`.
  - Replace with a real auth middleware in production (JWT or provider SDK).

Security hardening included:

- `helmet` (sane HTTP headers)
- `express-rate-limit` (generous defaults to not hinder tests)
- `pino-http` (structured logs)

---

## Data Model (high level)

- Users, Profiles, Businesses, Vehicles, Bookings, Payments, Messages, Reviews, Documents, TravelLog, TravelPhoto.
- Booking protection:
  - DB exclusion constraint on `bookings` prevents overlapping bookings for the same vehicle when status ∈ {CONFIRMED, ACTIVE}.
  - Application-level conditional updates for state transitions (e.g., PENDING → CONFIRMED).
- Messages archival:
  - `messages_archive` table for old messages; job moves old rows and deletes originals.

See `prisma/app.schema.prisma` for full definitions.

---

## API Overview

Base path: `/api`

Health

- `GET /api/health` → `{ ok: true }`

Cars

- `GET /api/cars` — list cars (thin controller; mocked in tests)
- `GET /api/cars/:id` — car by id
- `GET /api/cars/:id/availability` — booked ranges for a car (note: controller is currently aligned with mocked tests; ensure model alignment if extending)
- `POST /api/cars` — create car (requires `req.user` via auth shim or real auth)

Bookings (lifecycle)

- `POST /api/bookings/request` — body: `{ vehicleId, startDate, endDate, pickupLocation?, dropoffLocation? }`
  - Creates PENDING booking; basic validation; returns price and dates
- `POST /api/bookings/:id/approve` — owner-only; moves PENDING → CONFIRMED with conditional update; overlap conflicts → 409
- `POST /api/bookings/:id/pay` — customer-only; CONFIRMED → ACTIVE; upserts Payment
- `POST /api/bookings/:id/complete` — ACTIVE → COMPLETED
- `POST /api/bookings/:id/cancel` — PENDING|CONFIRMED → CANCELLED (owner or customer)
- `GET /api/bookings/mine?status=&limit=&cursor=` — customer bookings with cursor pagination (see below)
- `GET /api/bookings/vehicle/:vehicleId?status=&limit=&cursor=` — owner view for a vehicle

Pagination cursors

- Cursor is base64 of `{ c: ISO_createdAt, i: id }`
- Response: `{ data: { items: [...], nextCursor } }`

Error format

- `{ ok: false, code: <MACHINE_CODE>, message: <HUMAN_MESSAGE> }`
- Common codes: `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `INVALID_INPUT`, `INVALID_DATES`, `INVALID_TRANSITION`, `NOT_AVAILABLE`, `DB_ERROR`

---

## Handy curl examples

Request a booking (customer):

```
curl -X POST http://localhost:5001/api/bookings/request \
  -H 'Content-Type: application/json' \
  -H 'x-user-id: <CUSTOMER_ID>' \
  -d '{
    "vehicleId": "<VEHICLE_ID>",
    "startDate": "2025-11-15",
    "endDate": "2025-11-17",
    "pickupLocation": "Airport",
    "dropoffLocation": "Downtown"
  }'
```

Approve booking (owner):

```
curl -X POST http://localhost:5001/api/bookings/<BOOKING_ID>/approve \
  -H 'x-user-id: <OWNER_ID>'
```

Paginate my bookings:

```
curl 'http://localhost:5001/api/bookings/mine?limit=2' -H 'x-user-id: <CUSTOMER_ID>'
```

---

## Testing & Coverage

- Run tests from repo root: `npm test` (Jest, runInBand)
- Global coverage thresholds enforced (statements/branches/functions/lines): `70/62/65/72`
- Notable tests:
  - `tests/api.spec.js` — end-to-end booking flow and pagination
  - `tests/carController.*.spec.js` — mocked car controller tests (raise coverage without DB coupling)
  - `tests/archive.spec.js` — archive job success/failure paths
  - `tests/db.spec.js` — DB-level interactions (requires DB)

---

## Database Patches & Utilities

- `prisma/raw/pg-patches.sql` — adds exclusion constraints, generated range column, indexes, and review booking trigger (idempotent).
- Apply them with: `node prisma/apply-patches.js`.
- Optional DB test harness: `node prisma/db-tests.js` (runs several DB checks, advisory locks, etc.).

---

## Jobs & Scheduling

- Archive job: `node scripts/archive-messages.js`
- Scheduler: `node scripts/archive-scheduler.js` (cron pattern inside file; default 02:00 UTC)
- Set `TZ` for timezone-sensitive schedules.

---

## Building & Deployment options

- Compose (dev/staging): `devops/docker-compose.yml` with `db`, `api`, and optional `frontend` services.
- Unified image (Express serves SPA) via `devops/Dockerfile`.
- Nginx SPA image via `devops/Dockerfile.frontend` and `devops/nginx.conf` (proxies `/api/`).
- Health endpoints:
  - API: `GET /api/health`
  - Nginx static: `GET /healthz`

---

## Conventions & Tips

- Always import Prisma via `getPrisma()` (`backend/src/models/prisma.js`). For tests, use `__setPrismaForTest` or DI.
- Use conditional updates (`updateMany` with prior status) to avoid race conditions on state transitions.
- Prefer DB-driven protections (constraints) plus application checks where user role/intent matters.
- Keep `/api` routes pure JSON; SPA assets are served outside `/api`.

Common pitfalls:

- `carController` tests are mocked; if you wire it to the real DB, align names with Prisma models (`Vehicle`, `Booking.vehicleId`, etc.).
- Prisma connection flakiness (Neon cold starts) can raise `P1001`. The app includes a retry in sensitive spots; for scripts/tests, retry after a short delay or ensure DB is warm.

---

## APKs / Mobile builds

- This repository does not contain Android APKs or a mobile app module. If APKs are produced elsewhere, add links or artifact paths here (e.g., CI artifacts or `mobile/` folder). For now: Not applicable.

---

## Useful one-liners

- Generate Prisma client: `npx prisma generate --schema=prisma/app.schema.prisma`
- Sync schema to DB: `npx prisma db push --schema=prisma/app.schema.prisma`
- Apply SQL patches: `node prisma/apply-patches.js`
- Run API locally: `cd backend && npm start`
- Compose up (API+DB): `docker compose -f devops/docker-compose.yml up -d db api`
- Full stack: `docker compose -f devops/docker-compose.yml up -d db api frontend`

---

## Troubleshooting

- Prisma `P1001: database server was not reached`:
  - Verify `DATABASE_URL_APP`; ensure Postgres is up (`docker ps`, `docker logs rentmyride-db`).
  - If using cloud Postgres, allowlisted IP/firewall and cold start delays can apply.
- Migrations vs db push:
  - For local dev, `db push` is fine; for shared environments, prefer migrations.
- 409 `NOT_AVAILABLE` on approve/pay:
  - Overlap exclusion constraint is working; pick non-overlapping dates or cancel existing bookings.

## Contributing

- Lint: `npm run lint` (fix: `npm run lint:fix`)
- Keep controllers thin, move data access via `getPrisma()` into small, testable units when complexity grows.
- Prefer small PRs with test coverage for new behavior.

If anything’s unclear or you need a deeper dive into a specific area, check the file paths above first—they’re kept small and focused.
