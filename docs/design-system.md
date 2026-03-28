# Design System

## Typography

**Inter** (loaded via Google Fonts) is the primary typeface, configured as `font-sans` in `tailwind.config.js`. Weights used: 400, 500, 600, 700.

## Colour palette

| Role           | Tailwind class                                                     | Usage                         |
| -------------- | ------------------------------------------------------------------ | ----------------------------- |
| App background | `bg-slate-50`                                                      | Page background               |
| Surface        | `bg-white`                                                         | Cards, panels                 |
| Border         | `border-slate-200`                                                 | Subtle dividers               |
| Text primary   | `text-slate-800` / `text-slate-900`                                | Main content / headings       |
| Text muted     | `text-slate-400`                                                   | Hints, labels                 |
| Slot — free    | `bg-emerald-600 text-white hover:bg-emerald-700 transition-colors` | Bookable                      |
| Slot — booked  | `bg-rose-400 text-white opacity-70 cursor-not-allowed`             | Taken, disabled               |
| Slot — blocked | `bg-slate-300 text-slate-500 cursor-not-allowed`                   | Non-working / lunch / holiday |
| Primary button | `bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg`        | Primary action                |
| Danger button  | `bg-rose-400 hover:bg-rose-500 text-white rounded-lg`              | Cancel / destructive          |
| Error text     | `text-rose-500 text-xs mt-1`                                       | Field-level validation error  |
| Loading        | `animate-pulse bg-slate-200 rounded`                               | Skeleton loaders              |

## Component shapes

- **Card / panel**: `bg-white rounded-xl shadow-sm border border-slate-200 p-6`
- **Input**: `rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-3 py-2 text-sm outline-none transition-all`
- **Slot button**: `rounded-lg text-sm font-medium py-2.5 px-3 transition-colors`
- **Nav link (active)**: `bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full`
- **Nav link (inactive)**: `text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-3 py-1.5 rounded-full`

## Rules

- Use only standard Tailwind utility classes — no arbitrary values (`text-[13px]`, `mt-[7px]`, etc.)
- Spacing scale: prefer `gap-3`, `gap-4`, `p-4`, `p-6` — avoid one-off values
- All user-visible strings must go through `t('key')` — never hardcode UI text
- Every i18n key must be present in all three locale files: `en.ts`, `fr.ts`, `nl.ts`
