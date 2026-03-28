# Roadmap

## Legend

| Symbol | Status      |
| ------ | ----------- |
| `[ ]`  | Not started |
| `[~]`  | In progress |
| `[x]`  | Completed   |
| `[!]`  | Blocked     |

Dependencies are noted as `← needs: #ID`.

---

## Phase 1 — Project Skeleton

> Goal: both apps boot, talk to each other, nothing more.

| ID  | Task                                                        | Status | Depends on |
| --- | ----------------------------------------------------------- | ------ | ---------- |
| 1.1 | Init `server/` — Express + TypeScript + ts-node-dev         | `[ ]`  |            |
| 1.2 | Init `client/` — Vue 3 + TypeScript + Vite                  | `[ ]`  |            |
| 1.3 | Configure Tailwind CSS in client                            | `[ ]`  | 1.2        |
| 1.4 | Set up Vite proxy `/api` → `localhost:3000`                 | `[ ]`  | 1.2        |
| 1.5 | Add root `package.json` with `dev` script (runs both apps)  | `[ ]`  | 1.1, 1.2   |
| 1.6 | Health-check route `GET /api/health` returns `{ ok: true }` | `[ ]`  | 1.1        |
| 1.7 | Client fetches `/api/health` and displays status on boot    | `[ ]`  | 1.4, 1.6   |

---

## Phase 2 — Server Foundation

> Goal: DB up, config served, business hours reachable.

| ID  | Task                                                                     | Status | Depends on |
| --- | ------------------------------------------------------------------------ | ------ | ---------- |
| 2.1 | Set up SQLite with `better-sqlite3`, auto-create `server/data/db.sqlite` | `[ ]`  | 1.1        |
| 2.2 | Create DB migration runner (simple versioned SQL files)                  | `[ ]`  | 2.1        |
| 2.3 | Migration 001 — create `appointments` table                              | `[ ]`  | 2.2        |
| 2.4 | Migration 002 — create `blocked_dates` table                             | `[ ]`  | 2.2        |
| 2.5 | Seed Belgian public holidays into `blocked_dates` (static list)          | `[ ]`  | 2.4        |
| 2.6 | `server/config.ts` — business hours, lunch break, slot duration          | `[ ]`  | 1.1        |
| 2.7 | `GET /api/config` — return config to client                              | `[ ]`  | 2.6        |
| 2.8 | `TENANT_CONFIG` env var overrides config on startup                      | `[ ]`  | 2.6        |

---

## Phase 3 — Blocked Dates API

> Goal: client can fetch which days are blocked.

| ID  | Task                                                                 | Status | Depends on |
| --- | -------------------------------------------------------------------- | ------ | ---------- |
| 3.1 | `GET /api/blocked-dates?from=&to=` — return blocked ranges in period | `[ ]`  | 2.4        |
| 3.2 | Server validates `from` / `to` query params (ISO 8601, from <= to)   | `[ ]`  | 3.1        |

---

## Phase 4 — Appointments API

> Goal: full booking and cancellation lifecycle on the server.

| ID   | Task                                                                              | Status | Depends on |
| ---- | --------------------------------------------------------------------------------- | ------ | ---------- |
| 4.1  | `GET /api/appointments/by-date?date=` — return booked `start_time` list for a day | `[ ]`  | 2.3        |
| 4.2  | `POST /api/appointments` — booking with full server-side validation               | `[ ]`  | 2.3, 2.6   |
| 4.3  | Validation: required fields, email format, reason max 500 chars                   | `[ ]`  | 4.2        |
| 4.4  | Validation: `start_time` not in the past                                          | `[ ]`  | 4.2        |
| 4.5  | Validation: `start_time` within business hours, outside lunch break               | `[ ]`  | 4.2, 2.6   |
| 4.6  | Validation: date not blocked                                                      | `[ ]`  | 4.2, 2.4   |
| 4.7  | Atomic insert — concurrent same-slot requests return 409                          | `[ ]`  | 4.2        |
| 4.8  | Generate UUID v4 cancellation token on booking                                    | `[ ]`  | 4.2        |
| 4.9  | `GET /api/appointments/:token` — return appointment details                       | `[ ]`  | 2.3        |
| 4.10 | `DELETE /api/appointments/:token` — cancel appointment                            | `[ ]`  | 4.8        |
| 4.11 | Cancellation: reject if within `cancelDeadlineHours` of slot                      | `[ ]`  | 4.10, 2.6  |
| 4.12 | Cancellation: idempotent (already cancelled → 200)                                | `[ ]`  | 4.10       |

---

## Phase 5 — Client: Calendar & Slot Grid

> Goal: user can navigate days and see the correct slot colors.

| ID  | Task                                                                         | Status | Depends on    |
| --- | ---------------------------------------------------------------------------- | ------ | ------------- |
| 5.1 | Pinia store — fetch and cache config from `/api/config`                      | `[ ]`  | 2.7           |
| 5.2 | Pinia store — fetch and cache blocked dates for visible month                | `[ ]`  | 3.1           |
| 5.3 | Pinia store — fetch booked slots for selected date                           | `[ ]`  | 4.1           |
| 5.4 | `useSlotGenerator` composable — generate slots from config for a given date  | `[ ]`  | 5.1           |
| 5.5 | Slot status logic: free / booked / non-working / blocked                     | `[ ]`  | 5.2, 5.3, 5.4 |
| 5.6 | Day navigator component — prev/next, disable past days and blocked days      | `[ ]`  | 5.2           |
| 5.7 | Slot grid component — render slots with `emerald-600 / rose-400 / slate-300` | `[ ]`  | 5.5           |
| 5.8 | `SlotListView` — compose navigator + grid                                    | `[ ]`  | 5.6, 5.7      |

---

## Phase 6 — Client: Booking Flow

> Goal: user fills the form and gets a token.

| ID  | Task                                                               | Status | Depends on |
| --- | ------------------------------------------------------------------ | ------ | ---------- |
| 6.1 | `BookView` — form: first name, last name, email, reason (optional) | `[ ]`  | 5.8        |
| 6.2 | Client-side form validation (required fields, email format)        | `[ ]`  | 6.1        |
| 6.3 | Submit booking → `POST /api/appointments`                          | `[ ]`  | 4.2, 6.2   |
| 6.4 | Success screen — display token prominently with copy-to-clipboard  | `[ ]`  | 6.3        |
| 6.5 | Error handling — show user-friendly messages for 409, 400, 422     | `[ ]`  | 6.3        |

---

## Phase 7 — Client: Cancellation Flow

> Goal: user pastes a token and cancels their appointment.

| ID  | Task                                                              | Status | Depends on |
| --- | ----------------------------------------------------------------- | ------ | ---------- |
| 7.1 | `CancelView` — token input + lookup button                        | `[ ]`  | 1.2        |
| 7.2 | Fetch appointment details by token → display summary              | `[ ]`  | 4.9, 7.1   |
| 7.3 | Confirm cancellation → `DELETE /api/appointments/:token`          | `[ ]`  | 4.10, 7.2  |
| 7.4 | Show success / error feedback (past deadline, already cancelled…) | `[ ]`  | 7.3        |

---

## Phase 8 — Polish & SaaS Readiness

> Goal: production-ready, embeddable, white-label.

| ID  | Task                                                                            | Status | Depends on    |
| --- | ------------------------------------------------------------------------------- | ------ | ------------- |
| 8.1 | Vue Router — routes for `/`, `/book`, `/cancel/:token?`                         | `[ ]`  | 5.8, 6.1, 7.1 |
| 8.2 | Responsive layout with Tailwind (mobile first)                                  | `[ ]`  | 5.8, 6.1, 7.1 |
| 8.3 | Loading skeletons / spinners on all async operations                            | `[ ]`  | 5.8, 6.1, 7.1 |
| 8.4 | Global error boundary in Vue                                                    | `[ ]`  | 8.1           |
| 8.5 | `TENANT_CONFIG` env var tested end-to-end with different timezone               | `[ ]`  | 2.8, 4.5      |
| 8.6 | `vite build` output embeddable as iframe or Web Component                       | `[ ]`  | 8.1           |
| 8.7 | Production `npm start` script — serves built client as static files from server | `[ ]`  | 8.6           |
| 8.8 | `.env.example` files for both client and server                                 | `[ ]`  | 2.8           |
| 8.9 | README `Getting Started` verified end-to-end from scratch                       | `[ ]`  | 8.7           |

---

## Design System

> Applied throughout phases 5–7. Not a separate phase — each UI task must follow these guidelines.

### Principles

- **Functional first** — every element has a clear purpose; nothing decorative that creates noise
- **Modern & clean** — generous whitespace, consistent spacing scale, no clutter
- **User-friendly** — obvious affordances, clear feedback, zero ambiguity on what to do next
- **Warm & approachable** — neutral background, soft shadows, rounded corners (`rounded-xl`), never cold or clinical

### Typography

| Role            | Class                         |
| --------------- | ----------------------------- |
| Page title      | `text-2xl font-semibold`      |
| Section heading | `text-lg font-medium`         |
| Body            | `text-sm text-slate-700`      |
| Muted / hint    | `text-xs text-slate-400`      |
| Font family     | System font stack (no import) |

### Color Palette

| Token         | Tailwind class                                   | Usage                           |
| ------------- | ------------------------------------------------ | ------------------------------- |
| Background    | `bg-slate-50`                                    | App background — warm off-white |
| Surface       | `bg-white`                                       | Cards, panels                   |
| Border        | `border-slate-200`                               | Subtle dividers                 |
| Text primary  | `text-slate-800`                                 | Main content                    |
| Text muted    | `text-slate-400`                                 | Hints, labels, placeholders     |
| Slot free     | `bg-emerald-600 text-white`                      | Bookable slot                   |
| Slot booked   | `bg-rose-400 text-white opacity-70`              | Taken, disabled                 |
| Slot blocked  | `bg-slate-300 text-slate-500`                    | Non-working / lunch / holiday   |
| CTA button    | `bg-emerald-600 hover:bg-emerald-700 text-white` | Primary action                  |
| Danger button | `bg-rose-400 hover:bg-rose-500 text-white`       | Cancel action                   |

### Spacing & Shape

- Spacing scale: `p-4` / `gap-3` / `gap-4` — never arbitrary values
- Cards: `rounded-xl shadow-sm border border-slate-200 bg-white p-6`
- Inputs: `rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500`
- Slots: `rounded-lg text-sm font-medium py-2 px-3 transition-colors`
- Disabled slots: `cursor-not-allowed`

### Slot Grid Layout

- Grid of time slots displayed as a responsive wrap of pill/tile buttons
- Each slot shows the time (e.g. `09:00`) and its color state
- On hover of a free slot: `bg-emerald-700` (slightly darker, smooth `transition`)
- No hover effect on disabled slots

### Forms

- Label above input, never placeholder-only
- Inline validation on blur (not on every keystroke)
- Error messages in `text-rose-500 text-xs mt-1`
- Submit button disabled while loading; shows spinner inside button

### Feedback & States

| State   | Treatment                                                                |
| ------- | ------------------------------------------------------------------------ |
| Loading | Skeleton shimmer (`animate-pulse bg-slate-200 rounded`)                  |
| Success | Green check icon + short message in `text-emerald-600`                   |
| Error   | `text-rose-500` inline or in a `bg-rose-50 border-rose-200` alert banner |
| Empty   | Centered muted text with a subtle icon (no data for this day)            |

### Navigation

- Single top bar: app name/logo left, current date center, optional nav right
- Day navigator: `← prev` / date label / `next →` — large tap targets (`min-w-10 h-10`)
- Past days: button disabled + `opacity-40`
