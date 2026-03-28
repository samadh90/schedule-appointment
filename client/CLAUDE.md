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
│   ├── DayNavigator.vue     # ← date → navigation with weekend/holiday indicators
│   └── SlotGrid.vue         # Renders the slot grid for a given day
├── composables/
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

1. `App.vue` mounts → `appointmentsStore.connect()` opens Socket.IO
2. `SlotListView` → `configStore.fetchConfig()` (once) + `blockedDatesStore.fetchForMonth()` (lazy per month)
3. On date change → `appointmentsStore.fetchSlotsForDate(date)` (lazy, cached)
4. `useSlotGenerator.generateSlots()` is a **pure function** — UI-only; server re-validates everything
5. `slot:booked` / `slot:freed` Socket.IO events update `bookedSlots` reactively for all open tabs

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

## Validation (BookView)

Client-side `validateField()` catches errors before they reach the server:

- `first_name` / `last_name`: required, ≤ 100 chars
- `email`: required, ≤ 254 chars, basic regex format check
- `reason`: optional, ≤ 500 chars

The server enforces the same limits as a security backstop.

## Appointment type

`GET /api/appointments/:token` returns only: `cancellation_token`, `first_name`, `last_name`, `start_time`, `cancelled`, `reason`. The `id`, `email`, and `created_at` fields are intentionally excluded. The `Appointment` interface in `types/index.ts` reflects this — do not add those fields back.
