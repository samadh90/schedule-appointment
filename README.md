# Schedule Appointment

An embeddable appointment scheduling plugin. Drop it into any website or run it standalone — users can browse available slots, book an appointment, and cancel it, all without an account.

Designed as a white-label SaaS plugin: one config file per tenant, one SQLite file per instance.

## Tech stack

| Layer     | Technology                                                |
| --------- | --------------------------------------------------------- |
| Frontend  | Vue 3 + TypeScript + Vite + Tailwind CSS                  |
| State     | Pinia + Vue Router + vue-i18n v9 (EN / FR / NL / DE / RU) |
| Real-time | Socket.IO — slot updates pushed to all open tabs          |
| Backend   | Node.js + Express + Socket.IO                             |
| Database  | SQLite via `better-sqlite3`                               |

## Features

- Browse time slots day by day; weekends and holidays automatically greyed out
- Real-time updates — every open tab reacts instantly when a slot is booked or freed
- Book with name + email + optional reason; receive a UUID cancellation token
- Cancel any time before the deadline using that token — no account required
- Multilingual UI: EN / FR / NL / DE / RU, auto-detected from browser / host page language
- Embeddable widget — drop one `<script>` tag and a `data-schedule-widget` div, no JavaScript required
- Connection overlay when the server is unreachable; error boundary for unexpected crashes

## Prerequisites

- Node.js **≥ 24**
- pnpm ≥ 9 (`npm install -g pnpm`)

## Quick start

```bash
# Install all dependencies
pnpm install

# Start both apps with hot-reload (server :3000, client :5173)
pnpm dev

# Or start the embed demo instead of the SPA (server :3000, embed demo :5174)
pnpm dev:embed
```

Open **http://localhost:5173** (SPA) or **http://localhost:5174** (embed demo)

## Embedding in any website

```html
<!-- 1. Place the container wherever the widget should appear -->
<div data-schedule-widget data-api="https://your-api.example.com" data-lang="en"></div>

<!-- 2. Load the built widget — it initializes automatically -->
<script src="/path/to/widget.iife.js"></script>
```

`data-api` is the base URL of your deployed API. Omit it for same-origin deployments.  
`data-lang` overrides locale detection (which otherwise reads `<html lang>` then the browser).

For dynamic use cases the programmatic API is also available:

```js
import { init } from './widget.iife.js'
const widget = init('#my-div', { apiBase: 'https://...', lang: 'fr' })
// later:
widget.destroy()
```

## Documentation

| Topic                                               | File                                           |
| --------------------------------------------------- | ---------------------------------------------- |
| Environment variables & business hours config       | [docs/configuration.md](docs/configuration.md) |
| API endpoints, request/response shapes, rate limits | [docs/api.md](docs/api.md)                     |
| How slots work, Socket.IO events, business rules    | [docs/architecture.md](docs/architecture.md)   |
| Database schema and migrations                      | [docs/database.md](docs/database.md)           |
| Production build and deployment                     | [docs/deployment.md](docs/deployment.md)       |
| Tailwind design tokens and component shapes         | [docs/design-system.md](docs/design-system.md) |

## License

MIT
