# Copilot Instructions

## Project overview

**schedule-appointment** is a white-label, embeddable appointment-scheduling plugin.
Users browse available time slots, book with a name/email, receive a UUID cancellation token, and can cancel any time before the deadline — no account required.

The app is a **monorepo** with two independent apps:

| Dir       | Role                                         |
| --------- | -------------------------------------------- |
| `server/` | Node 24 + Express + Socket.IO + SQLite       |
| `client/` | Vue 3 + TypeScript + Vite + Tailwind + Pinia |

For server-specific conventions see `.github/instructions/server.instructions.md`.
For client-specific conventions see `.github/instructions/client.instructions.md`.

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

## Commit conventions

See [`.github/instructions/commits.instructions.md`](.github/instructions/commits.instructions.md).

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
