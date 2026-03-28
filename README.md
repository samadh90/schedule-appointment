# Schedule Appointment

An embeddable appointment scheduling plugin. Drop it into any website or run it standalone — users can browse available slots, book an appointment, and cancel it, all without an account.

Designed to be sold as a white-label SaaS plugin: one config file per tenant, one SQLite file per instance (or swap to Postgres for multi-tenant).

## Tech Stack

| Layer    | Technology                              |
| -------- | --------------------------------------- |
| Frontend | Vue 3 + TypeScript + Vite               |
| Styling  | Tailwind CSS                            |
| Backend  | Node.js + Express (minimal)             |
| Database | SQLite (via `better-sqlite3`)           |
| Project  | Monorepo — `client/` and `server/` dirs |

## User-Facing Features

- Navigate day by day (past days are greyed out and non-navigable)
- View all time slots of the selected day, color-coded by status:
    - 🟢 **Warm green** (`emerald-600`) — free and bookable
    - 🌸 **Warm rose** (`rose-400`) — taken by someone else, disabled
    - ⬜ **Grey** (`slate-300`) — non-working time, lunch break, or blocked day
- Book an appointment by providing first name, last name, email, and an optional reason
- Receive a unique cancellation token after booking
- Cancel an appointment using that token — no account required

## Business Rules

### Slot Generation

Slots are **generated client-side** from the business hours config — nothing is pre-inserted in the database. The client fetches two things from the server for a given date range:

1. Already booked appointments (to colour slots rose)
2. Blocked dates (to grey out entire days or ranges)

The server **re-validates all rules on every write** — client-side generation is for display only.

### Booking

| Rule                      | Detail                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| Required fields           | First name, last name, valid email, slot selection                                         |
| Optional field            | Reason / notes (free text, max 500 chars)                                                  |
| Past slots                | Client prevents selecting past days; server rejects any slot with `start_time` in the past |
| Slot in working hours     | Server validates the requested time falls within business hours and outside lunch break    |
| Blocked day               | Server rejects bookings on any date marked as blocked (holiday, sick, vacation…)           |
| Double-booking prevention | Booking is atomic; concurrent requests for the same slot return 409                        |
| Cancellation token        | A UUID v4 token is generated at booking time and returned to the user                      |

### Cancellation

| Rule           | Detail                                                                           |
| -------------- | -------------------------------------------------------------------------------- |
| Token required | The cancellation token issued at booking must be provided                        |
| Time limit     | Cannot cancel less than **N hours** before the slot (configurable, default: 2 h) |
| Idempotency    | Cancelling an already-cancelled appointment returns 200, not an error            |

### Business Hours

Defined in `server/config.ts` (per-tenant overridable):

```ts
businessHours: {
  timezone: "Europe/Brussels",   // IANA timezone
  schedule: {
    monday:    { open: "09:00", close: "17:00" },
    tuesday:   { open: "09:00", close: "17:00" },
    wednesday: { open: "09:00", close: "17:00" },
    thursday:  { open: "09:00", close: "17:00" },
    friday:    { open: "09:00", close: "16:00" },
    saturday:  null,   // closed
    sunday:    null,   // closed
  },
  lunchBreak: { start: "12:00", end: "13:00" }, // grey, non-bookable
  slotDuration: 30,              // minutes
  cancelDeadlineHours: 2,
}
```

### Blocked Dates

Stored in the database. Can be a single day or a range. Types:

| Type       | Examples                                             |
| ---------- | ---------------------------------------------------- |
| `holiday`  | Belgian public holidays (Toussaint, 11 nov, 25 déc…) |
| `sick`     | Unplanned closure                                    |
| `vacation` | Planned multi-day closure                            |
| `custom`   | Any other reason                                     |

The client requests the blocked dates for the visible date range and greys out those days on the calendar. The server also rejects any booking attempt on a blocked date.

Belgian public holidays can be seeded automatically from a static list or a public API.

## Project Structure

```
schedule-appointment/
├── client/                  # Vue 3 + TypeScript frontend
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── views/
│   │   │   ├── SlotListView.vue
│   │   │   ├── BookView.vue
│   │   │   └── CancelView.vue
│   │   ├── router/
│   │   ├── stores/          # Pinia stores
│   │   ├── types/           # Shared TypeScript types
│   │   └── App.vue
│   └── ...
├── server/                  # Express + SQLite backend
│   ├── src/
│   │   ├── config.ts        # Business hours & tenant config
│   │   ├── db/              # SQLite setup & migrations
│   │   ├── routes/          # API route handlers
│   │   └── index.ts         # Entry point
│   ├── data/
│   │   └── db.sqlite        # Auto-created on first run
│   └── ...
└── README.md
```

## Prerequisites

- Node.js >= 22
- npm >= 10

## Getting Started

### Install dependencies

```bash
# Frontend
cd client && npm install

# Backend
cd server && npm install
```

### Run in development

```bash
# Backend (port 3000)
cd server && npm run dev

# Frontend (port 5173)
cd client && npm run dev
```

The frontend dev server proxies `/api` requests to the backend.

## API Endpoints

| Method | Path                        | Description                                            |
| ------ | --------------------------- | ------------------------------------------------------ |
| GET    | `/api/config`               | Business hours config (slot duration, schedule…)       |
| GET    | `/api/blocked-dates`        | Blocked date ranges (`?from=2026-04-01&to=2026-04-30`) |
| GET    | `/api/appointments/by-date` | Booked slots for a day (`?date=2026-04-01`)            |
| POST   | `/api/appointments`         | Book an appointment → returns token                    |
| GET    | `/api/appointments/:token`  | Get appointment details by token                       |
| DELETE | `/api/appointments/:token`  | Cancel an appointment by token                         |

### POST `/api/appointments` — request body

```json
{
    "slotId": 42,
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane@example.com",
    "reason": "Annual checkup"
}
```

### POST `/api/appointments` — response

```json
{
    "id": 7,
    "token": "a1b2c3d4-...",
    "slot": { "startTime": "2026-04-01T09:00:00Z", "duration": 30 },
    "message": "Appointment confirmed."
}
```

## Database

SQLite file stored at `server/data/db.sqlite`. Created automatically on first run.

### Schema

```sql
CREATE TABLE appointments (
  id          INTEGER  PRIMARY KEY AUTOINCREMENT,
  start_time  DATETIME NOT NULL UNIQUE,   -- ISO 8601, server-validated
  first_name  TEXT     NOT NULL,
  last_name   TEXT     NOT NULL,
  email       TEXT     NOT NULL,
  reason      TEXT,
  token       TEXT     NOT NULL UNIQUE,   -- UUID v4, cancellation token
  cancelled   INTEGER  NOT NULL DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE blocked_dates (
  id         INTEGER  PRIMARY KEY AUTOINCREMENT,
  date_from  DATE     NOT NULL,
  date_to    DATE     NOT NULL,           -- same as date_from for single day
  type       TEXT     NOT NULL,           -- 'holiday' | 'sick' | 'vacation' | 'custom'
  label      TEXT,                        -- e.g. "Toussaint", "Congé annuel"
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## SaaS / Plugin Usage

The server reads a `TENANT_CONFIG` environment variable (JSON or path to a JSON file) that overrides `config.ts` defaults. This allows hosting multiple clients on the same server or packaging the whole thing as an embeddable widget.

```bash
TENANT_CONFIG='{"businessHours":{"timezone":"Europe/Paris"}}' npm start
```

Embed the frontend as an iframe or build it as a Web Component for drop-in integration on any website.

## Development

See [ROADMAP.md](ROADMAP.md) for the full phased development plan with task statuses and dependencies.

## License

MIT
