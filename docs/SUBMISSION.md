# RentMyRide Submission

## Features

- Booking lifecycle: request, approve, pay, complete, cancel
- Overlap prevention: DB exclusion constraint + conditional update
- Cursor-based pagination for bookings
- Car availability endpoint (calendar-ready)
- Message archival job (cron + manual)
- Security: rate limiting, helmet, structured logging
- Coverage thresholds enforced (≥70/62/65/72)
- All API E2E tests pass

## How to Run

```bash
npm install
npm run dev # or npm start (see README)
```

## How to Test

```bash
npm test
```

## Health Check

```bash
curl http://localhost:3000/api/health
# Response: { "ok": true }
```

## Design Decisions

- Booking status transitions are guarded for integrity and concurrency.
- Overlap exclusion is enforced at both DB and app level.
- Cursor pagination is robust to malformed input.
- Car availability endpoint is calendar-friendly (ISO date ranges).
- Message archival is scheduled and documented.
- Coverage excludes generated and MySQL-only code for reliability.
- DB connectivity guard in tests reduces CI flakiness.
- All code is ESM, ready for modern Node.js.
