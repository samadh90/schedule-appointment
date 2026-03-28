---
description: 'Use when writing or editing client-side code: Vue components, Pinia stores, composables, i18n, routing, Tailwind styling, or any file under client/.'
applyTo: 'client/**'
---

# Client Conventions

## Stack

- **Framework**: Vue 3 Composition API — `<script setup lang="ts">` **only**, never Options API
- **Build**: Vite 5
- **Styling**: Tailwind CSS — use only the design tokens below, never arbitrary values
- **State**: Pinia stores in `client/src/stores/`
- **Routing**: Vue Router — routes: `/` (slot list) · `/book` (booking form) · `/cancel/:token?` (cancellation)
- **i18n**: vue-i18n v9, `legacy: false` — always `useI18n()` / `t('key')`, never hardcode UI strings
- **Real-time**: Socket.IO client — connect/disconnect managed exclusively by `appointmentsStore`

## Vite Proxy

`/api` and `/socket.io` are proxied to `http://localhost:3000` in `vite.config.ts`.
There is no `VITE_API_BASE_URL` env var — edit `server.proxy` directly if the backend URL changes.

## Component Rules

- Always `<script setup lang="ts">` — no `defineComponent`, no Options API
- One component per file; filename in PascalCase matching the component name
- Do not import types from other stores or components — keep types in `client/src/types/`
- Emit events with `defineEmits`; expose nothing unless a parent explicitly needs it via `defineExpose`

## Pinia Stores

- Use `defineStore` with the Composition API style (`setup` function, not options object)
- Store files live in `client/src/stores/` — one concern per file
- Never call `fetch` directly in a component — always go through a store or composable
- Socket.IO event handlers must be registered inside `appointmentsStore` only

## i18n Conventions

- **Never hardcode user-visible strings** in `.vue` files — always `t('key')`
- Add every new key to **all three** locale files: `client/src/i18n/locales/en.ts`, `fr.ts`, `nl.ts`
- Locale auto-detected from `navigator.language` on first visit, then persisted in `localStorage`
- Call `saveLocale(locale)` from `client/src/i18n/index.ts` when the user switches language

## Design System (Tailwind tokens)

Use **only** these tokens — no arbitrary values (`text-[13px]`, `mt-[7px]`, etc.):

| Role             | Class                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| App background   | `bg-slate-50`                                                            |
| Card / panel     | `bg-white rounded-xl shadow-sm border border-slate-200 p-6`              |
| Input            | `rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500` |
| Slot — free      | `bg-emerald-600 text-white hover:bg-emerald-700 transition-colors`       |
| Slot — booked    | `bg-rose-400 text-white opacity-70 cursor-not-allowed`                   |
| Slot — blocked   | `bg-slate-300 text-slate-500 cursor-not-allowed`                         |
| Primary button   | `bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg`              |
| Danger button    | `bg-rose-400 hover:bg-rose-500 text-white rounded-lg`                    |
| Error text       | `text-rose-500 text-xs mt-1`                                             |
| Muted text       | `text-slate-400`                                                         |
| Loading skeleton | `animate-pulse bg-slate-200 rounded`                                     |

Spacing scale: `p-4`, `gap-3`, `gap-4` — never one-off values.

## Slot Generator

`useSlotGenerator.ts` generates the full slot array client-side from config. Rules:

- Past slots → `blocked` (greyed, not interactive)
- Lunch break slots → `blocked`
- Closed days / blocked dates → entire day `blocked`
- Slots in `bookedSlots` from store → `booked` (rose, disabled)
- Everything else → `free` (emerald, clickable)

The server re-validates all of this on write — client-side is display only.

## Form Validation

- Validate on **blur**, not on every keystroke
- Show errors in `text-rose-500 text-xs mt-1` below the field
- Disable submit button while request is in flight; show inline spinner inside the button
- Never surface raw server `error` strings — map known error codes to `t('key')` messages

## Connection Overlay

`useConnectionStatus()` exposes `isOnline: Ref<boolean>`. The overlay (`ConnectionOverlay.vue`) is mounted in `App.vue` and shows automatically after a 2 s debounce when `isOnline` is false. It hides automatically on recovery — no user interaction required.
