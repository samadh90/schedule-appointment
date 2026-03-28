# Copilot Instructions

## Project overview

**schedule-appointment** is a white-label, embeddable appointment-scheduling plugin.
Users browse available time slots, book with a name/email, receive a UUID cancellation token, and can cancel any time before the deadline — no account required.

The app is a **monorepo** with two independent apps:

| Dir       | Role                                         |
| --------- | -------------------------------------------- |
| `server/` | Node 24 + Express + Socket.IO + SQLite       |
| `client/` | Vue 3 + TypeScript + Vite + Tailwind + Pinia |

---

## Tech stack cheatsheet

### Server (`server/`)

- **Runtime**: Node.js ≥ 24
- **Framework**: Express 4
- **DB**: `better-sqlite3` v12 (synchronous, no ORM)
- **Real-time**: Socket.IO (same HTTP server as Express — see `index.ts`)
- **Language**: TypeScript, compiled via `ts-node-dev` in dev, `tsc` for prod
- **Config**: `server/src/config.ts` — business hours, `workDays`, slot duration, etc.
- **Migrations**: versioned `.sql` files in `server/src/migrations/`, run automatically on boot

### Client (`client/`)

- **Framework**: Vue 3 Composition API (`<script setup>` only — never Options API)
- **Build**: Vite 5
- **Styling**: Tailwind CSS — use only the design tokens below, no arbitrary values
- **State**: Pinia stores in `client/src/stores/`
- **Routing**: Vue Router — routes: `/` (slot list), `/book` (booking form), `/cancel` (cancellation)
- **i18n**: vue-i18n v9 with `legacy: false` — always use `useI18n` / `t()`, never hardcode UI strings
- **Real-time**: Socket.IO client — connect/disconnect managed by `appointmentsStore`

---

## Key architectural rules

### Slots are generated client-side

`useSlotGenerator.ts` builds the full slot array from config (open/close times, lunch break, slot duration). The server never pre-inserts slots — it only stores actual bookings. The client colours each slot by comparing generated times against the `bookedSlots` cache from the store.

### Server re-validates everything on write

Never rely on client-side checks for security. `POST /api/appointments` re-validates:

- Required fields, email format, reason ≤ 500 chars
- `start_time` in the future
- `start_time` within business hours and outside lunch break
- Day of week is in `config.workDays`
- Date not in `blocked_dates`
- Slot not already taken (409 on concurrent conflict)

### Socket.IO events

The server emits to **all** connected clients after every successful write:

```ts
io.emit('slot:booked', { date: 'YYYY-MM-DD', time: 'HH:MM' })
io.emit('slot:freed', { date: 'YYYY-MM-DD', time: 'HH:MM' })
```

`appointmentsStore.connect()` subscribes; `disconnect()` tears down. `App.vue` calls both.

### Date arithmetic

**Always use the local-time constructor** — never `new Date('YYYY-MM-DD')` (parses as UTC and breaks on DST transition days like the last Sunday of March in Belgium):

```ts
// ✅ correct
const d = new Date(year, month - 1, day)

// ❌ wrong — UTC, DST bugs
const d = new Date('2026-03-29')
```

---

## Config & environment variables

### Server env vars (`server/.env`)

| Var               | Default                 | Description                                          |
| ----------------- | ----------------------- | ---------------------------------------------------- |
| `PORT`            | `3000`                  | HTTP listen port                                     |
| `TENANT_CONFIG`   | —                       | JSON string; whitelisted keys only (see `config.ts`) |
| `ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated allowed CORS origins                 |

### Client env vars (`client/.env`)

The Vite dev server proxies `/api` and `/socket.io` to `http://localhost:3000` (hardcoded in `vite.config.ts`). To change the backend URL, edit `server.proxy` in `vite.config.ts` — there is no `VITE_API_BASE_URL` env var.

### TENANT_CONFIG whitelisted keys

`openTime` · `closeTime` · `lunchStart` · `lunchEnd` · `slotDurationMins` · `cancelDeadlineHours` · `timezone` · `workDays`

Any other key is silently dropped (prototype pollution prevention).

---

## Database conventions

- SQLite file: `server/data/db.sqlite` (auto-created)
- All queries use **parameterised statements** — never string interpolation in SQL
- `appointments` has a **partial unique index** `WHERE cancelled = 0` so cancelled slots can be rebooked
- Constraint errors: use `err.code.startsWith('SQLITE_CONSTRAINT')` (v12 uses `SQLITE_CONSTRAINT_UNIQUE`, not `SQLITE_CONSTRAINT`)
- New migrations: add a file `server/src/migrations/NNN_snake_case_name.sql` — filename must match `/^\d{3}_[a-z0-9_]+\.sql$/`

---

## API conventions

- All routes prefixed `/api/`
- JSON body for POST; query params for GET filters
- `start_time` is always `YYYY-MM-DDTHH:MM:SS` (local time string, no `Z`)
- `by-date` returns `HH:MM` strings (`.substring(11, 16)`), not full ISO strings
- Error shape: `{ error: string, field?: string }`
- 200/201 success, 400 validation, 404 not found, 409 conflict, 422 business rule

---

## i18n conventions

- **Never hardcode user-visible strings** in Vue components — always `t('key')`
- Add new keys to all three locale files: `client/src/i18n/locales/en.ts`, `fr.ts`, `nl.ts`
- Locale is auto-detected from `navigator.language` on first visit, then read from `localStorage`
- `saveLocale(locale)` from `client/src/i18n/index.ts` must be called when the user switches

---

## Design system (Tailwind)

Use only these tokens — no arbitrary values:

| Role             | Class                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| App background   | `bg-slate-50`                                                            |
| Card / panel     | `bg-white rounded-xl shadow-sm border border-slate-200 p-6`              |
| Input            | `rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500` |
| Slot — free      | `bg-emerald-600 text-white hover:bg-emerald-700`                         |
| Slot — booked    | `bg-rose-400 text-white opacity-70 cursor-not-allowed`                   |
| Slot — blocked   | `bg-slate-300 text-slate-500 cursor-not-allowed`                         |
| Primary button   | `bg-emerald-600 hover:bg-emerald-700 text-white`                         |
| Danger button    | `bg-rose-400 hover:bg-rose-500 text-white`                               |
| Error text       | `text-rose-500 text-xs mt-1`                                             |
| Muted text       | `text-slate-400`                                                         |
| Loading skeleton | `animate-pulse bg-slate-200 rounded`                                     |

---

## Commit conventions

Use **Conventional Commits**:

```
feat(scope): short description
fix(scope): short description
chore: short description
docs: short description
```

Scopes: `server`, `client`, `security`, `db`, `i18n`

---

## Running locally

```bash
# Install all deps
npm install && cd client && npm install && cd ../server && npm install

# Start both apps (concurrently)
cd .. && npm run dev
# server → http://localhost:3000
# client → http://localhost:5173
```
