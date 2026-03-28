# Configuration

## Server environment variables

| Variable          | Default                 | Description                                      |
| ----------------- | ----------------------- | ------------------------------------------------ |
| `PORT`            | `3000`                  | HTTP listen port                                 |
| `NODE_ENV`        | —                       | Set to `production` to enable SPA serving        |
| `TENANT_CONFIG`   | —                       | JSON string — overrides business hours config    |
| `ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated list of allowed frontend origins |

Copy `server/.env.example` to `server/.env` to get started.

## Client environment variables

| Variable        | Default | Description                               |
| --------------- | ------- | ----------------------------------------- |
| `VITE_BASE_URL` | `/`     | Base path when deploying under a sub-path |

Set this at build time (not at runtime). See [deployment.md](deployment.md).

## Business hours (`TENANT_CONFIG`)

The server reads a `TENANT_CONFIG` environment variable (JSON string) that deep-merges over the defaults in `server/src/config.ts`. All keys are optional — only specify what you want to override.

```bash
TENANT_CONFIG='{"openTime":"08:00","closeTime":"17:00","timezone":"Europe/Paris"}' npm start
```

| Key                   | Type       | Default             | Description                          |
| --------------------- | ---------- | ------------------- | ------------------------------------ |
| `openTime`            | `"HH:MM"`  | `"09:00"`           | First bookable slot of the day       |
| `closeTime`           | `"HH:MM"`  | `"18:00"`           | Slots must start before this time    |
| `lunchStart`          | `"HH:MM"`  | `"12:00"`           | Start of lunch break                 |
| `lunchEnd`            | `"HH:MM"`  | `"13:00"`           | End of lunch break                   |
| `slotDurationMins`    | `number`   | `30`                | Minutes per slot                     |
| `cancelDeadlineHours` | `number`   | `24`                | Cannot cancel within N hours of slot |
| `workDays`            | `number[]` | `[1,2,3,4,5]`       | Days of week (0 = Sun … 6 = Sat)     |
| `timezone`            | `string`   | `"Europe/Brussels"` | IANA timezone for local-time parsing |

Any unrecognised key is silently dropped (prototype pollution prevention). Invalid JSON or out-of-range values cause the server to exit on startup.

## CORS

Set `ALLOWED_ORIGINS` to restrict which frontend origins may connect (CORS + Socket.IO):

```bash
ALLOWED_ORIGINS=https://yoursite.com,https://www.yoursite.com npm start
```

The default (`http://localhost:5173`) is for local development only — always set this in production.
