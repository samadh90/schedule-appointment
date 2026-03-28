# Architecture

## Overview

```
Browser (Vue 3 SPA)
  │  HTTP /api/*          WebSocket /socket.io
  └──────────────────────────────────────────▶ Express + Socket.IO (Node.js)
                                                       │
                                                  SQLite (better-sqlite3)
```

The client and server are independent apps in a monorepo. In development, Vite proxies `/api` and `/socket.io` to `localhost:3000`. In production, Express serves the compiled SPA directly (see [deployment.md](deployment.md)).

---

## Slot generation (client-side)

Slots are **never pre-inserted** in the database. The client generates the full slot array for any given day using `useSlotGenerator.ts`, which reads the config (open/close times, lunch break, slot duration) and colours each slot by comparing against two server responses:

1. `GET /api/appointments/by-date?date=YYYY-MM-DD` → already-booked `HH:MM` strings
2. `GET /api/blocked-dates?from=…&to=…` → blocked date range

| Slot status | Condition                                          |
| ----------- | -------------------------------------------------- |
| `blocked`   | Past time, or lunch break, or blocked/non-work day |
| `booked`    | In the `bookedSlots` cache from the store          |
| `free`      | Everything else                                    |

The server **re-validates all rules on every write** — client-side generation is display-only.

---

## Real-time updates (Socket.IO)

After every successful write the server emits to **all** connected clients:

| Event         | Payload                                 | Triggered when                        |
| ------------- | --------------------------------------- | ------------------------------------- |
| `slot:booked` | `{ date: "YYYY-MM-DD", time: "HH:MM" }` | An appointment is successfully booked |
| `slot:freed`  | `{ date: "YYYY-MM-DD", time: "HH:MM" }` | An appointment is cancelled           |

`appointmentsStore.connect()` subscribes to these events and updates the reactive `bookedSlots` cache. `App.vue` calls `connect()` on mount and `disconnect()` on unmount.

---

## Business rules

### Booking

| Rule                | Detail                                                                        |
| ------------------- | ----------------------------------------------------------------------------- |
| Required fields     | First name, last name, valid email, slot selection                            |
| Optional field      | Reason (free text, max 500 chars)                                             |
| Past slots          | Client skips past days; server rejects any `start_time` in the past           |
| Business hours      | Server validates time is within `openTime`–`closeTime`, outside lunch break   |
| Work days           | Server rejects bookings on days not in `workDays` (default Mon–Fri)           |
| Blocked day         | Server rejects bookings on any date in `blocked_dates`                        |
| Double-booking      | Booking is atomic; concurrent requests for the same slot return 409           |
| Cancelled rebooking | A cancelled slot can be rebooked (partial unique index `WHERE cancelled = 0`) |
| Cancellation token  | UUID v4 generated at booking time and returned to the user                    |

### Cancellation

| Rule           | Detail                                                                      |
| -------------- | --------------------------------------------------------------------------- |
| Token required | The UUID issued at booking must be provided                                 |
| Deadline       | Cannot cancel within `cancelDeadlineHours` of the slot (default 24 h) → 422 |
| Idempotency    | Cancelling an already-cancelled appointment returns 200                     |
| Real-time      | Success emits `slot:freed` — the slot turns green everywhere instantly      |

---

## Date and timezone handling

`start_time` is stored and returned as `YYYY-MM-DDTHH:MM:00` in the configured `timezone` — **no UTC offset, no `Z` suffix**. All business-rule validation goes through `toTZParts(date, config.timezone)`.

**Never use `new Date('YYYY-MM-DD')`** — it parses as UTC midnight and breaks on DST transition days (e.g. last Sunday of March in Belgium). Always use the local-time constructor:

```ts
// ✅ correct
const d = new Date(year, month - 1, day)

// ❌ wrong — UTC, breaks on DST boundaries
const d = new Date('2026-03-29')
```

---

## Resilience

- **Connection overlay** — `useConnectionStatus` polls `GET /api/health` every 5 s (3 s timeout) and listens to `window` `online`/`offline` events. Offline state is debounced 2 s to avoid flickering; recovery is instant. When offline, `ConnectionOverlay.vue` renders a full-screen modal.
- **Error boundary** — `onErrorCaptured` in `App.vue` catches unhandled Vue render errors and replaces the UI with a reload prompt instead of a broken screen.
