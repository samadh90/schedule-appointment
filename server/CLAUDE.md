# server

Node.js + Express + Socket.IO API. SQLite via `better-sqlite3` (synchronous). TypeScript compiled to `dist/`.

## Commands

```bash
npm run dev          # ts-node-dev with hot-reload on src/index.ts
npm run build        # tsc → dist/
npm run start        # node dist/index.js (production)
npx tsc --noEmit     # type-check only — run after every TS change
```

## Structure

```
src/
├── index.ts              # Express + Socket.IO setup, CORS, rate limiters, route mounting
├── config.ts             # Config interface, defaultConfig, TENANT_CONFIG validation + buildConfig()
├── db.ts                 # SQLite singleton (WAL mode), triggers runMigrations()
├── migrations/
│   ├── runner.ts         # Reads *.sql files in order, tracks applied in _migrations table
│   ├── 001_create_appointments.sql
│   ├── 002_create_blocked_dates.sql
│   ├── 003_seed_holidays.sql   # Belgian public holidays 2024–2026
│   └── 004_fix_start_time_unique.sql
└── routes/
    ├── health.ts         # GET /api/health → { ok: true }
    ├── config.ts         # GET /api/config → Config object
    ├── blockedDates.ts   # GET /api/blocked-dates?from=&to=
    └── appointments.ts   # Full CRUD — see below
```

## Database schema

**appointments**

| Column             | Type          | Notes                                               |
| ------------------ | ------------- | --------------------------------------------------- |
| id                 | INTEGER PK    | Auto-increment                                      |
| cancellation_token | TEXT UNIQUE   | UUID v4                                             |
| first_name         | TEXT          | ≤ 100 chars                                         |
| last_name          | TEXT          | ≤ 100 chars                                         |
| email              | TEXT          | ≤ 254 chars — not returned by GET /:token           |
| reason             | TEXT nullable | ≤ 500 chars                                         |
| start_time         | TEXT          | Normalised `YYYY-MM-DDTHH:MM:00` in config.timezone |
| cancelled          | INTEGER       | 0 = active, 1 = cancelled (soft delete)             |
| created_at         | TEXT          | SQLite `datetime('now')`                            |

Partial unique index: `idx_active_start_time ON appointments(start_time) WHERE cancelled = 0`

**blocked_dates**: `date TEXT UNIQUE`, `label TEXT nullable`

**\_migrations**: tracks applied migration file names

## API routes

| Method | Path                      | Rate limit      | Notes                                          |
| ------ | ------------------------- | --------------- | ---------------------------------------------- |
| GET    | /api/health               | —               | Liveness probe                                 |
| GET    | /api/config               | 60/min/IP       | Returns full Config                            |
| GET    | /api/blocked-dates        | 60/min/IP       | `?from=YYYY-MM-DD&to=YYYY-MM-DD`               |
| GET    | /api/appointments/by-date | 60/min/IP       | `?date=YYYY-MM-DD` → `{ slots: ["HH:MM", …] }` |
| POST   | /api/appointments         | **10/15min/IP** | Books a slot                                   |
| GET    | /api/appointments/:token  | 20/min/IP       | Lookup — omits id/email/created_at             |
| DELETE | /api/appointments/:token  | 20/min/IP       | Cancel — respects cancelDeadlineHours          |

## appointments.ts helpers

### `toTZParts(date, tz)`

Extracts `{ datePart, timePart, localMinute, dayOfWeek }` from a UTC `Date` in the configured timezone using `Intl.DateTimeFormat('en-GB', { hour12: false, … })`.
Use this for **all** business-rule checks. Never use `start_time.substring()` or `new Date(localStr)` for validation.

### `localToUTC(localStr, tz)`

Converts a stored `YYYY-MM-DDTHH:MM:00` local string to the correct UTC `Date`.
Use this in the cancellation deadline check — `new Date(localStr)` would use server timezone which may not be Brussels.

## Booking validation order (POST /)

1. Required fields present + string type
2. Length limits: names ≤ 100, email ≤ 254, reason ≤ 500
3. Valid ISO datetime + not in the past
4. `toTZParts()` → business hours (`openTime` ≤ time < `closeTime`)
5. Not in lunch break
6. Slot alignment: `localMinute % slotDurationMins === 0`
7. Work day check (`config.workDays`)
8. Not a blocked date
9. Normalise to `YYYY-MM-DDTHH:MM:00`, INSERT — SQLITE_CONSTRAINT → 409

## Config (TENANT_CONFIG)

Override any `Config` field via `TENANT_CONFIG` env var (JSON string).
`buildConfig()` validates on startup — invalid JSON or wrong types call `process.exit(1)`.

Validated fields:

- `openTime / closeTime / lunchStart / lunchEnd`: must match `/^\d{2}:\d{2}$/`
- `slotDurationMins`: positive integer ≤ 240
- `cancelDeadlineHours`: non-negative number
- `timezone`: must be accepted by `new Intl.DateTimeFormat(undefined, { timeZone })`
- `workDays`: array of integers 0–6

## CORS

`ALLOWED_ORIGINS` env var (comma-separated). Dev default: `['http://localhost:5173']`.
Applied identically to Express CORS middleware and Socket.IO `cors.origin`.

## Adding migrations

Create `src/migrations/NNN_description.sql` with the next sequential number. The runner applies all unapplied `.sql` files in alphabetical order inside a transaction. Never modify an already-applied migration — add a new one instead.
