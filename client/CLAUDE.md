# client

Vue 3 + TypeScript SPA. Built with Vite. Styled with Tailwind CSS (no component library).

## Commands

```bash
npm run dev          # Vite dev server on :5173, proxies /api and /socket.io to :3000
npm run build        # vue-tsc type-check + vite build → dist/
npx vue-tsc --noEmit # type-check only — run after every TS/Vue change
```

## Structure

```
src/
├── components/
│   ├── AppLayout.vue        # Header + language switcher
│   ├── ConnectionOverlay.vue# Full-screen modal shown when isOnline = false; uses connection.* keys
│   ├── DayNavigator.vue     # ← date → navigation with weekend/holiday indicators
│   └── SlotGrid.vue         # Renders the slot grid for a given day
├── composables/
│   ├── useConnectionStatus.ts # Polls /api/health every 5s + window online/offline events; debounces offline by 2s
│   └── useSlotGenerator.ts  # Pure function: generates Slot[] from config + booked times
├── i18n/
│   ├── index.ts             # createI18n, locale detection (navigator.language), localStorage persistence
│   └── locales/
│       ├── en.ts
│       ├── fr.ts
│       └── nl.ts
├── router/index.ts          # / → SlotListView, /book → BookView, /cancel/:token? → CancelView
├── stores/
│   ├── appointments.ts      # Socket.IO connection + bookedSlots cache (date → HH:MM[])
│   ├── blockedDates.ts      # Blocked dates store, lazy-loads by month
│   └── config.ts            # AppConfig fetched once from /api/config
├── types/index.ts           # AppConfig, BlockedDate, Appointment, Slot, SlotStatus
└── views/
    ├── SlotListView.vue     # Main calendar page
    ├── BookView.vue         # Booking form
    └── CancelView.vue       # Token lookup + cancel
```

## State & data flow

1. `App.vue` mounts → `appointmentsStore.connect()` opens Socket.IO + `useConnectionStatus()` starts health polling
2. `SlotListView` → `configStore.fetchConfig()` (once) + `blockedDatesStore.fetchForMonth()` (lazy per month)
3. On date change → `appointmentsStore.fetchSlotsForDate(date)` (lazy, cached)
4. `useSlotGenerator.generateSlots()` is a **pure function** — UI-only; server re-validates everything
5. `slot:booked` / `slot:freed` Socket.IO events update `bookedSlots` reactively for all open tabs

## Error boundary & connection overlay

`App.vue` handles two failure modes at the root level:

- **Fatal error boundary** — `onErrorCaptured` catches any uncaught Vue component error, sets `fatalError`, and replaces the entire UI with a `error.boundaryTitle` / `error.boundaryMsg` / `error.reload` screen.
- **Connection overlay** — `useConnectionStatus` returns `isOnline`; when `false`, `<ConnectionOverlay>` is rendered as a fixed z-50 backdrop. It uses `connection.offlineTitle` / `connection.offlineMsg` keys.

`useConnectionStatus` logic:

- Polls `GET /api/health` every 5 seconds (3s `AbortSignal` timeout)
- Also listens to `window` `online` / `offline` events
- Offline state is **debounced 2 seconds** to avoid flickering on brief drops; recovery is instant

## Routing

| Path              | Component    | Notes                                               |
| ----------------- | ------------ | --------------------------------------------------- |
| `/`               | SlotListView | Main calendar                                       |
| `/book`           | BookView     | Requires `?date=YYYY-MM-DD&time=HH:MM` query params |
| `/cancel/:token?` | CancelView   | Token can be pre-filled via URL param               |

## i18n rules

- Locale auto-detected from `navigator.language`; persisted in `localStorage` under key `locale`
- Supported: `en`, `fr`, `nl`. Fallback: `en`
- **Every user-visible string must have a key in all three locale files.** Never add a key to one file without adding it to the other two.
- Never display a raw server `error` string if a translation key covers that error case. Add a key and map it on the client.

Current top-level key groups: `nav`, `lang`, `slot`, `book`, `error`, `connection`, `cancel`

| Group        | Used by                            |
| ------------ | ---------------------------------- |
| `nav`        | `AppLayout.vue`                    |
| `lang`       | `AppLayout.vue` language switcher  |
| `slot`       | `SlotListView.vue`, `SlotGrid.vue` |
| `book`       | `BookView.vue`                     |
| `error`      | `App.vue` error boundary           |
| `connection` | `ConnectionOverlay.vue`            |
| `cancel`     | `CancelView.vue`                   |

## Validation (BookView)

Client-side `validateField()` catches errors before they reach the server:

- `first_name` / `last_name`: required, ≤ 100 chars
- `email`: required, ≤ 254 chars, basic regex format check
- `reason`: optional, ≤ 500 chars

The server enforces the same limits as a security backstop.

## Appointment type

`GET /api/appointments/:token` returns only: `cancellation_token`, `first_name`, `last_name`, `start_time`, `cancelled`, `reason`. The `id`, `email`, and `created_at` fields are intentionally excluded. The `Appointment` interface in `types/index.ts` reflects this — do not add those fields back.
