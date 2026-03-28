---
description: 'Use when writing or editing server-side code: Express routes, middleware, SQLite queries, migrations, config, validation, Socket.IO events, or any file under server/.'
applyTo: 'server/**'
---

# Server Conventions

## Stack

- **Runtime**: Node.js ≥ 22
- **Framework**: Express 4
- **DB**: `better-sqlite3` v12 (synchronous, no ORM, no promises)
- **Real-time**: Socket.IO attached to the same HTTP server as Express (`index.ts`)
- **Language**: TypeScript — compiled via `ts-node-dev` in dev, `tsc` for prod

## Config & Environment

| Var               | Default                 | Description                                          |
| ----------------- | ----------------------- | ---------------------------------------------------- |
| `PORT`            | `3000`                  | HTTP listen port                                     |
| `TENANT_CONFIG`   | —                       | JSON string; whitelisted keys only (see `config.ts`) |
| `ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated allowed CORS origins                 |

### TENANT_CONFIG whitelisted keys

`openTime` · `closeTime` · `lunchStart` · `lunchEnd` · `slotDurationMins` · `cancelDeadlineHours` · `timezone` · `workDays`

Any other key is silently dropped (prototype pollution prevention). Bad JSON or out-of-range values → `process.exit(1)` on startup.

## Database Conventions

- SQLite file: `server/data/db.sqlite` (auto-created on first run)
- **Always use parameterised statements** — never string interpolation in SQL
- `appointments` has a **partial unique index** `WHERE cancelled = 0` — cancelled slots can be rebooked
- Detect conflicts: `err.code === 'SQLITE_CONSTRAINT_UNIQUE'` (better-sqlite3 v12)
- New migrations: `server/src/migrations/NNN_snake_case_name.sql` — filename must match `/^\d{3}_[a-z0-9_]+\.sql$/`
- Migration runner auto-runs on boot; never edit already-applied migrations

## API Conventions

- All routes prefixed `/api/`
- JSON body for POST; query params for GET filters
- `start_time` stored and returned as `YYYY-MM-DDTHH:MM:00` — **local time, no `Z` suffix**
- `by-date` endpoint returns `HH:MM` strings only
- Error shape: `{ error: string, field?: string }`
- HTTP status codes: 200/201 success · 400 validation · 404 not found · 409 conflict · 422 business rule

## Validation Rules (POST /api/appointments)

All of these must be enforced server-side regardless of what the client sends:

1. `firstName`, `lastName`, `email`, `start_time` — required, non-empty
2. `firstName`, `lastName` ≤ 100 chars; `email` ≤ 254 chars; `reason` ≤ 500 chars
3. `email` matches RFC 5322 pattern
4. `start_time` is in the future (compare against `Date.now()` in the server's timezone)
5. Day of week is in `config.workDays`
6. Time falls within `openTime`–`closeTime` (exclusive)
7. Time does not fall within `lunchStart`–`lunchEnd`
8. Minute component satisfies `minute % slotDurationMins === 0`
9. Date is not in `blocked_dates`
10. No active (non-cancelled) appointment already at that `start_time` (→ 409)

## Socket.IO

Emit after every successful write — do not emit on errors or cancellations that fail:

```ts
io.emit('slot:booked', { date: 'YYYY-MM-DD', time: 'HH:MM' })
io.emit('slot:freed', { date: 'YYYY-MM-DD', time: 'HH:MM' })
```

## Security

- Rate limiting: general 60 req/min/IP; booking endpoint 10 req/15 min/IP; token ops 20 req/min/IP
- CORS: use `ALLOWED_ORIGINS` env var — never `origin: '*'` in production
- Never expose `id`, `email`, or `created_at` from `GET /api/appointments/:token` (privacy)
