# schedule-appointment

Anonymous appointment booking system. No authentication — a UUID v4 cancellation token is the only secret given to the user after booking.

## Monorepo structure

```
/
├── client/        Vue 3 + TypeScript SPA (Vite)
├── server/        Node.js + Express + Socket.IO API (TypeScript)
├── embed/         Embeddable widget package (Vite library mode)
└── package.json   Root: runs apps via concurrently
```

## Commands

```bash
# Development — SPA + server
pnpm dev

# Development — embed demo + server
pnpm dev:embed

# Build
pnpm --filter ./client build   # vue-tsc + vite build
pnpm --filter ./server build   # tsc
pnpm --filter ./embed build    # vite library build → widget.iife.js

# Format
pnpm format          # write
pnpm format:check    # CI check
```

Always run `npx tsc --noEmit` in `server/` and `npx vue-tsc --noEmit` in `client/` after any TypeScript change. Both must pass with zero errors before committing.

## Architecture

- **Client** calls `/api/*` via Vite dev proxy; in production via `VITE_API_BASE_URL`
- **Server** emits `slot:booked` and `slot:freed` Socket.IO events; client reacts in real time across all open tabs
- **Database** is SQLite at `server/data/db.sqlite`; migrations run automatically on server start via `server/src/migrations/runner.ts`
- Soft-delete pattern: `cancelled = 1` frees the slot; a partial unique index on `appointments(start_time) WHERE cancelled = 0` enforces one active booking per slot

## Key invariants — read before touching business logic

- `start_time` is stored as normalised `YYYY-MM-DDTHH:MM:00` in **config.timezone** local time (no offset suffix). Never store the raw user-supplied string.
- All business-rule validation (hours, lunch, day-of-week, slot alignment) goes through `toTZParts(date, config.timezone)` — never `substring()` on the raw input string or `new Date()` assuming server timezone.
- The cancellation deadline check converts stored local time to UTC via `localToUTC(localStr, config.timezone)` before comparing with `Date.now()`.
- `GET /api/appointments/:token` intentionally omits `id`, `email`, and `created_at` (C2 privacy fix). Do not add them back.

## Internationalization

Three locales: `en`, `fr`, `nl` — all in `client/src/i18n/locales/`.

**Rule:** every user-visible string must have a key in all three locale files. Never add a key to one locale without adding it to the other two. Never surface a raw server `error` string to the user if a translation key can cover that case.

## Security baseline

| Control        | Detail                                                                            |
| -------------- | --------------------------------------------------------------------------------- |
| Rate limiting  | General: 60 req/min/IP. Booking: 10/15 min/IP. Token ops: 20/min/IP               |
| CORS           | `ALLOWED_ORIGINS` env var (comma-separated). Dev default: `http://localhost:5173` |
| TENANT_CONFIG  | Validated on startup; bad JSON or invalid values → `process.exit(1)`              |
| Input limits   | Names ≤ 100 chars, email ≤ 254 chars, reason ≤ 500 chars — client + server        |
| Slot alignment | `localMinute % slotDurationMins === 0` enforced server-side                       |
