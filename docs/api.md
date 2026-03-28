# API Reference

All routes are prefixed with `/api/`. The server accepts and returns JSON.

## Endpoints

| Method   | Path                              | Description                                           |
| -------- | --------------------------------- | ----------------------------------------------------- |
| `GET`    | `/api/health`                     | Returns `{ ok: true }`                                |
| `GET`    | `/api/config`                     | Business hours config (slot duration, schedule, etc.) |
| `GET`    | `/api/blocked-dates?from=&to=`    | Blocked dates in a date range (ISO 8601 dates)        |
| `GET`    | `/api/appointments/by-date?date=` | Booked `HH:MM` times for a given day                  |
| `POST`   | `/api/appointments`               | Book an appointment → returns cancellation token      |
| `GET`    | `/api/appointments/:token`        | Fetch appointment details by cancellation token       |
| `DELETE` | `/api/appointments/:token`        | Cancel an appointment by cancellation token           |

---

## `POST /api/appointments`

### Request body

```json
{
  "start_time": "2026-04-01T09:00:00",
  "first_name": "Jane",
  "last_name":  "Doe",
  "email":      "jane@example.com",
  "reason":     "Annual checkup"
}
```

`reason` is optional. `start_time` must be a local-time string in `YYYY-MM-DDTHH:MM:SS` format with no `Z` or offset suffix.

### 201 response

```json
{
  "cancellation_token": "a1b2c3d4-e5f6-...",
  "start_time":  "2026-04-01T09:00:00",
  "first_name":  "Jane",
  "last_name":   "Doe",
  "email":       "jane@example.com",
  "reason":      "Annual checkup"
}
```

### Validation rules (server-enforced)

| Rule | Detail |
| ---- | ------ |
| Required fields | `first_name`, `last_name`, `email`, `start_time` |
| Length limits | Names ≤ 100 chars, email ≤ 254 chars, reason ≤ 500 chars |
| Email format | RFC 5322 pattern |
| Future slot | `start_time` must be in the future |
| Work day | Day of week must be in `workDays` |
| Business hours | Time must fall within `openTime`–`closeTime` |
| Lunch break | Time must not fall within `lunchStart`–`lunchEnd` |
| Slot alignment | Minute component must satisfy `minute % slotDurationMins === 0` |
| Blocked date | Date must not be in `blocked_dates` |
| No double-booking | Only one active booking per slot (409 on conflict) |

---

## `GET /api/appointments/:token`

Returns appointment details. `id`, `email`, and `created_at` are intentionally omitted for privacy.

### 200 response

```json
{
  "cancellation_token": "a1b2c3d4-e5f6-...",
  "start_time":  "2026-04-01T09:00:00",
  "first_name":  "Jane",
  "last_name":   "Doe",
  "reason":      "Annual checkup",
  "cancelled":   0
}
```

---

## `DELETE /api/appointments/:token`

Cancels an appointment. Returns 200 even if already cancelled (idempotent).

Cannot cancel within `cancelDeadlineHours` of the slot start time → 422.

---

## Error responses

| Status | Meaning                                                    |
| ------ | ---------------------------------------------------------- |
| 400    | Validation failure (missing field, bad email, past slot…)  |
| 404    | Token not found                                            |
| 409    | Slot already booked by a concurrent request                |
| 422    | Business rule violation (e.g. within cancellation deadline)|

Error shape: `{ "error": "human-readable message", "field": "fieldName" }`  
`field` is present only for field-level validation errors.

---

## Rate limiting

| Scope | Limit |
| ----- | ----- |
| General | 60 requests / min / IP |
| `POST /api/appointments` | 10 requests / 15 min / IP |
| Token operations (GET/DELETE `/:token`) | 20 requests / min / IP |
