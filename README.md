# Schedule Appointment

An embeddable appointment scheduling plugin. Drop it into any website or run it standalone — users can browse available slots, book an appointment, and cancel it, all without an account.

Designed to be sold as a white-label SaaS plugin: one config file per tenant, one SQLite file per instance (or swap to Postgres for multi-tenant).

## Tech Stack

| Layer     | Technology                                       |
| --------- | ------------------------------------------------ |
| Frontend  | Vue 3 + TypeScript + Vite                        |
| Styling   | Tailwind CSS                                     |
| State     | Pinia + Vue Router                               |
| i18n      | vue-i18n v9 (EN / FR / NL)                       |
| Real-time | Socket.IO (slot updates pushed to all open tabs) |
| Backend   | Node.js + Express + Socket.IO                    |
| Database  | SQLite via `better-sqlite3`                      |
| Project   | Monorepo — `client/` and `server/` dirs          |

## User-Facing Features

- Navigate day by day with **← →** arrows; weekends are automatically skipped
- **Jump to any date** — click the date label to open a native date picker
- View all time slots for the selected day, colour-coded by status:
  - 🟢 **Emerald** (`emerald-600`) — free and bookable
  - 🌸 **Rose** (`rose-400`) — taken, disabled
  - ⬜ **Grey** (`slate-300`) — non-working, lunch break, or blocked day
- **Real-time updates** — when someone books or cancels a slot, every open browser tab updates instantly via Socket.IO (no refresh needed)
- Book an appointment by providing first name, last name, email, and an optional reason (max 500 chars)
- Receive a unique cancellation token after booking (copy-to-clipboard button)
- Cancel an appointment using that token — no account required
- **Multilingual UI** — English, French (FR), Dutch (NL); auto-detected from browser language, persisted in `localStorage`, switchable at any time via the header buttons

## Business Rules

### Slot Generation

Slots are **generated client-side** from the business hours config — nothing is pre-inserted in the database. The client fetches two things from the server for a given date:

1. Already-booked appointments (to colour slots rose)
2. Blocked dates (to grey out entire days)

The server **re-validates all rules on every write** — client-side generation is for display only.

### Booking

| Rule                      | Detail                                                                                         |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| Required fields           | First name, last name, valid email, slot selection                                             |
| Optional field            | Reason / notes (free text, max 500 chars)                                                      |
| Past slots                | Client prevents selecting past days; server rejects any `start_time` in the past               |
| Slot in working hours     | Server validates the time falls within business hours and outside the lunch break              |
| Weekend / non-work day    | Server rejects bookings on days not in `workDays` (default: Mon–Fri)                           |
| Blocked day               | Server rejects bookings on any date marked as blocked (holiday, sick, vacation…)               |
| Double-booking prevention | Booking is atomic; concurrent requests for the same slot return 409                            |
| Cancelled slot rebooking  | A cancelled slot can be rebooked — enforced via a partial unique index (`WHERE cancelled = 0`) |
| Cancellation token        | A UUID v4 token is generated at booking time and returned to the user                          |

### Cancellation

| Rule           | Detail                                                                                 |
| -------------- | -------------------------------------------------------------------------------------- |
| Token required | The cancellation token issued at booking must be provided                              |
| Time limit     | Cannot cancel within **N hours** of the slot (configurable, default: 2 h)              |
| Idempotency    | Cancelling an already-cancelled appointment returns 200, not an error                  |
| Real-time      | Successful cancellation emits `slot:freed` — the slot turns green instantly everywhere |

### Business Hours

Defined in `server/src/config.ts` (per-tenant overridable via `TENANT_CONFIG`):

```ts
{
  timezone: "Europe/Brussels",    // IANA timezone
  openTime: "09:00",
  closeTime: "18:00",
  lunchStart: "12:00",
  lunchEnd: "13:00",
  slotDurationMins: 30,           // minutes
  cancelDeadlineHours: 24,
  workDays: [1, 2, 3, 4, 5],     // 0=Sun … 6=Sat; default Mon–Fri
}
```

### Blocked Dates

Stored in the `blocked_dates` table. Each row is one blocked day (date + optional label).
Belgian public holidays for 2024–2026 are pre-seeded by migration `003_seed_holidays.sql`.

| Type       | Examples                                  |
| ---------- | ----------------------------------------- |
| `holiday`  | Belgian public holidays (11 nov, 25 déc…) |
| `sick`     | Unplanned closure                         |
| `vacation` | Planned closure                           |
| `custom`   | Any other reason                          |

## Internationalisation (i18n)

The UI is fully translated in **English**, **French**, and **Dutch**.

| Behaviour       | Detail                                                                             |
| --------------- | ---------------------------------------------------------------------------------- |
| Auto-detection  | On first visit, `navigator.language` is checked: `nl-*` → NL, `fr-*` → FR, else EN |
| Manual switch   | `EN` / `FR` / `NL` pill buttons in the top-right of the header                     |
| Persistence     | Choice is saved to `localStorage` and restored on next visit                       |
| Fallback        | Any unrecognised locale falls back to English                                      |
| Date formatting | `toLocaleDateString` uses the active locale (`nl-BE` / `fr-BE` / `en-BE`)          |

## Real-Time Updates (Socket.IO)

The server emits two events over Socket.IO:

| Event         | Payload                                 | Triggered when                        |
| ------------- | --------------------------------------- | ------------------------------------- |
| `slot:booked` | `{ date: "YYYY-MM-DD", time: "HH:MM" }` | An appointment is successfully booked |
| `slot:freed`  | `{ date: "YYYY-MM-DD", time: "HH:MM" }` | An appointment is cancelled           |

Every connected browser tab reacts immediately — no polling, no page refresh.

## Project Structure

```
schedule-appointment/
├── client/                        # Vue 3 + TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── AppLayout.vue      # Header + language switcher
│   │   │   ├── DayNavigator.vue   # ← date → with weekend-skipping & date picker
│   │   │   └── SlotGrid.vue       # Colour-coded slot tiles
│   │   ├── composables/
│   │   │   └── useSlotGenerator.ts
│   │   ├── i18n/
│   │   │   ├── index.ts           # Locale detection + createI18n setup
│   │   │   └── locales/
│   │   │       ├── en.ts
│   │   │       ├── fr.ts
│   │   │       └── nl.ts
│   │   ├── router/index.ts
│   │   ├── stores/
│   │   │   ├── config.ts
│   │   │   ├── blockedDates.ts
│   │   │   └── appointments.ts    # Socket.IO connect/disconnect + reactive cache
│   │   ├── types/index.ts
│   │   ├── views/
│   │   │   ├── SlotListView.vue
│   │   │   ├── BookView.vue
│   │   │   └── CancelView.vue
│   │   ├── App.vue
│   │   └── main.ts
│   ├── .env.example
│   └── vite.config.ts             # Proxies /api and /socket.io (ws: true)
├── server/                        # Express + Socket.IO backend
│   ├── src/
│   │   ├── config.ts              # Business hours & tenant config
│   │   ├── db.ts                  # SQLite singleton + migration runner
│   │   ├── migrations/
│   │   │   ├── runner.ts
│   │   │   ├── 001_create_appointments.sql
│   │   │   ├── 002_create_blocked_dates.sql
│   │   │   ├── 003_seed_holidays.sql
│   │   │   └── 004_fix_start_time_unique.sql
│   │   ├── routes/
│   │   │   ├── health.ts
│   │   │   ├── config.ts
│   │   │   ├── blockedDates.ts
│   │   │   └── appointments.ts
│   │   └── index.ts               # HTTP server + Socket.IO + Express
│   ├── data/
│   │   └── db.sqlite              # Auto-created on first run
│   ├── .env.example
│   └── tsconfig.json
├── package.json                   # Root: `npm run dev` starts both apps
└── README.md
```

## Prerequisites

- Node.js **>= 24** (required by `better-sqlite3` v12)
- npm >= 10

## Getting Started

### 1. Install dependencies

```bash
# From the repo root — installs root, client, and server deps
npm install
cd client && npm install
cd ../server && npm install
```

### 2. Configure environment (optional)

```bash
# server/.env  (copy from server/.env.example)
PORT=3000
# TENANT_CONFIG='{"openTime":"08:00","closeTime":"18:00"}'
# ALLOWED_ORIGINS=http://localhost:5173   # comma-separated; default is localhost:5173
```

> The Vite dev server proxy hardcodes `localhost:3000` as the backend target. To change it, update `server.proxy` in `client/vite.config.ts`.

### 3. Run in development

```bash
# From the repo root — starts server (port 3000) + client (port 5173) concurrently
npm run dev
```

Or run them separately:

```bash
cd server && npm run dev   # ts-node-dev, auto-restarts on changes
cd client && npm run dev   # Vite HMR
```

The Vite dev server proxies both `/api` and `/socket.io` (including WebSocket upgrades) to `localhost:3000`.

### 4. Open the app

Visit **http://localhost:5173**

## API Endpoints

| Method   | Path                              | Description                                           |
| -------- | --------------------------------- | ----------------------------------------------------- |
| `GET`    | `/api/health`                     | Returns `{ ok: true }`                                |
| `GET`    | `/api/config`                     | Business hours config (slot duration, schedule, etc.) |
| `GET`    | `/api/blocked-dates?from=&to=`    | Blocked dates in a range (ISO 8601 dates)             |
| `GET`    | `/api/appointments/by-date?date=` | Booked `HH:MM` times for a given day                  |
| `POST`   | `/api/appointments`               | Book an appointment → returns cancellation token      |
| `GET`    | `/api/appointments/:token`        | Fetch appointment details by cancellation token       |
| `DELETE` | `/api/appointments/:token`        | Cancel an appointment by cancellation token           |

### `POST /api/appointments` — request body

```json
{
  "start_time": "2026-04-01T09:00:00",
  "first_name": "Jane",
  "last_name": "Doe",
  "email": "jane@example.com",
  "reason": "Annual checkup"
}
```

### `POST /api/appointments` — 201 response

```json
{
  "cancellation_token": "a1b2c3d4-e5f6-...",
  "start_time": "2026-04-01T09:00:00",
  "first_name": "Jane",
  "last_name": "Doe",
  "email": "jane@example.com",
  "reason": "Annual checkup"
}
```

### Error responses

| Status | Meaning                                                   |
| ------ | --------------------------------------------------------- |
| 400    | Validation failure (missing field, bad email, past slot…) |
| 404    | Token not found                                           |
| 409    | Slot already booked by someone else (concurrent booking)  |
| 422    | Cannot cancel — within the cancellation deadline          |

## Database

SQLite file at `server/data/db.sqlite`. Created and migrated automatically on first run.

### Schema

```sql
CREATE TABLE appointments (
  id                  INTEGER  PRIMARY KEY AUTOINCREMENT,
  start_time          DATETIME NOT NULL,
  first_name          TEXT     NOT NULL,
  last_name           TEXT     NOT NULL,
  email               TEXT     NOT NULL,
  reason              TEXT,
  cancellation_token  TEXT     NOT NULL UNIQUE,
  cancelled           INTEGER  NOT NULL DEFAULT 0,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Partial unique index: only one active booking per slot;
-- cancelled slots can be rebooked.
CREATE UNIQUE INDEX uq_appointments_start_time_active
  ON appointments(start_time)
  WHERE cancelled = 0;

CREATE TABLE blocked_dates (
  id         INTEGER  PRIMARY KEY AUTOINCREMENT,
  date       DATE     NOT NULL UNIQUE,
  type       TEXT     NOT NULL,   -- 'holiday' | 'sick' | 'vacation' | 'custom'
  label      TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Migrations

Migrations run automatically at server start. They are numbered SQL files in `server/src/migrations/`:

| File                            | Description                                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------------- |
| `001_create_appointments.sql`   | `appointments` table with partial unique index                                                    |
| `002_create_blocked_dates.sql`  | `blocked_dates` table                                                                             |
| `003_seed_holidays.sql`         | Belgian public holidays 2024–2026                                                                 |
| `004_fix_start_time_unique.sql` | Live migration: replaces table-level UNIQUE with partial index (allows rebooking cancelled slots) |

## SaaS / Tenant Configuration

The server reads a `TENANT_CONFIG` environment variable (JSON string) that deep-merges over the defaults in `config.ts`. This lets you host multiple tenants on the same server or customise the widget per deployment.

```bash
TENANT_CONFIG='{"openTime":"08:00","closeTime":"18:00","workDays":[1,2,3,4,5,6]}' npm start
```

Set `ALLOWED_ORIGINS` to restrict which frontend origins may connect (CORS + Socket.IO):

```bash
ALLOWED_ORIGINS=https://yoursite.com,https://www.yoursite.com npm start
```

Available overrides:

| Key                   | Type       | Default             | Description                          |
| --------------------- | ---------- | ------------------- | ------------------------------------ |
| `openTime`            | `"HH:MM"`  | `"09:00"`           | First bookable slot of the day       |
| `closeTime`           | `"HH:MM"`  | `"18:00"`           | Slots must start before this time    |
| `lunchStart`          | `"HH:MM"`  | `"12:00"`           | Start of lunch break                 |
| `lunchEnd`            | `"HH:MM"`  | `"13:00"`           | End of lunch break                   |
| `slotDurationMins`    | `number`   | `30`                | Minutes per slot                     |
| `cancelDeadlineHours` | `number`   | `24`                | Cannot cancel within N hours of slot |
| `workDays`            | `number[]` | `[1,2,3,4,5]`       | Days of week (0=Sun … 6=Sat)         |
| `timezone`            | `string`   | `"Europe/Brussels"` | IANA timezone (informational)        |

## Design System

### Colour Palette

| Token         | Tailwind class                                   | Usage                           |
| ------------- | ------------------------------------------------ | ------------------------------- |
| Background    | `bg-slate-50`                                    | App background — warm off-white |
| Surface       | `bg-white`                                       | Cards, panels                   |
| Border        | `border-slate-200`                               | Subtle dividers                 |
| Text primary  | `text-slate-800`                                 | Main content                    |
| Text muted    | `text-slate-400`                                 | Hints, labels                   |
| Slot free     | `bg-emerald-600 text-white`                      | Bookable                        |
| Slot booked   | `bg-rose-400 text-white opacity-70`              | Taken, disabled                 |
| Slot blocked  | `bg-slate-300 text-slate-500`                    | Non-working / lunch / holiday   |
| CTA button    | `bg-emerald-600 hover:bg-emerald-700 text-white` | Primary action                  |
| Danger button | `bg-rose-400 hover:bg-rose-500 text-white`       | Cancel action                   |

### Component Shapes

- Cards: `rounded-xl shadow-sm border border-slate-200 bg-white p-6`
- Inputs: `rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500`
- Slots: `rounded-lg text-sm font-medium py-2 px-3 transition-colors`

## Development

See [ROADMAP.md](ROADMAP.md) for the full phased development plan.

## License

MIT
