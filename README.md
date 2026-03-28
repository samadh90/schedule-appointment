# Schedule Appointment

An embeddable appointment scheduling plugin. Drop it into any website or run it standalone — users can browse available slots, book an appointment, and cancel it, all without an account.

Designed as a white-label SaaS plugin: one config file per tenant, one SQLite file per instance.

## Tech stack

| Layer     | Technology                                       |
| --------- | ------------------------------------------------ |
| Frontend  | Vue 3 + TypeScript + Vite + Tailwind CSS         |
| State     | Pinia + Vue Router + vue-i18n v9 (EN / FR / NL)  |
| Real-time | Socket.IO — slot updates pushed to all open tabs |
| Backend   | Node.js + Express + Socket.IO                    |
| Database  | SQLite via `better-sqlite3`                      |

## Features

- Browse time slots day by day; weekends and holidays automatically greyed out
- Real-time updates — every open tab reacts instantly when a slot is booked or freed
- Book with name + email + optional reason; receive a UUID cancellation token
- Cancel any time before the deadline using that token — no account required
- Multilingual UI: EN / FR / NL, auto-detected from browser language
- Connection overlay when the server is unreachable; error boundary for unexpected crashes

## Prerequisites

- Node.js **≥ 24**
- npm ≥ 10

## Quick start

```bash
# Install all dependencies
npm install && cd client && npm install && cd ../server && npm install

# Start both apps with hot-reload (server :3000, client :5173)
cd .. && npm run dev
```

Open **http://localhost:5173**

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
