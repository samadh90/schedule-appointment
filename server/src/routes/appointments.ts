import { Router, Request, Response } from 'express'
import { randomUUID } from 'crypto'
import rateLimit from 'express-rate-limit'
import db from '../db'
import { config } from '../config'
import { io } from '../index'
import { fireWebhook } from '../utils/webhook'
import { sendBookingConfirmation, sendCancellationConfirmation } from '../utils/mailer'

const router = Router()

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface AppointmentRow {
  id: number
  cancellation_token: string
  first_name: string
  last_name: string
  email: string
  reason: string | null
  start_time: string
  cancelled: number
  created_at: string
}

// Stricter limiter for booking attempts: 10 per 15 minutes per IP (C1)
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many booking attempts, please try again later' },
})

// Limiter for token lookups and cancellations: 20 per minute per IP (C1)
const tokenLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
})

/**
 * Extract local date/time parts for a UTC instant in the configured timezone. (H3)
 * Returns datePart "YYYY-MM-DD", timePart "HH:MM", localMinute 0–59, and day-of-week 0=Sun.
 */
function toTZParts(date: Date, tz: string) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'long',
    hour12: false,
  })
  const p: Record<string, string> = {}
  for (const { type, value } of fmt.formatToParts(date)) p[type] = value

  const datePart = `${p.year}-${p.month}-${p.day}`
  // Some environments emit "24" instead of "00" for midnight with hour12:false
  const rawHour = p.hour === '24' ? '00' : p.hour
  const hour = rawHour.padStart(2, '0')
  const minute = p.minute.padStart(2, '0')
  const timePart = `${hour}:${minute}`

  const weekdays: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  }
  return {
    datePart,
    timePart,
    localMinute: parseInt(minute, 10),
    dayOfWeek: weekdays[p.weekday] ?? -1,
  }
}

/**
 * Convert a stored "YYYY-MM-DDTHH:MM:00" local-time string (in tz) to the correct UTC Date. (H3)
 * Avoids the server-local-timezone assumption of new Date(localStr).
 */
function localToUTC(localStr: string, tz: string): Date {
  // Pretend the local string is UTC as a reference, then correct for the actual offset
  const naive = new Date(localStr + 'Z')
  const parts = toTZParts(naive, tz)
  const displayedAsUTC = new Date(`${parts.datePart}T${parts.timePart}:00Z`)
  const offsetMs = naive.getTime() - displayedAsUTC.getTime()
  return new Date(naive.getTime() + offsetMs)
}

// GET /by-date?date=YYYY-MM-DD
router.get('/by-date', (req: Request, res: Response) => {
  const { date } = req.query

  if (!date || typeof date !== 'string' || !ISO_DATE_RE.test(date)) {
    return res.status(400).json({ error: '"date" must be a valid date in YYYY-MM-DD format' })
  }

  // start_time is stored as normalised "YYYY-MM-DDTHH:MM:00" local strings, so substring(11,16) is safe
  const rows = db
    .prepare('SELECT start_time FROM appointments WHERE start_time >= ? AND start_time < ? AND cancelled = 0')
    .all(`${date}T00:00:00`, `${date}T23:59:60`) as Pick<AppointmentRow, 'start_time'>[]

  return res.json({ slots: rows.map(r => r.start_time.substring(11, 16)) })
})

// POST /
router.post('/', bookingLimiter, (req: Request, res: Response) => {
  const { first_name, last_name, email, reason, start_time } = req.body as Record<string, unknown>

  // Required fields: presence + type
  for (const field of ['first_name', 'last_name', 'email', 'start_time'] as const) {
    if (!req.body[field] || typeof req.body[field] !== 'string' || !(req.body[field] as string).trim()) {
      return res.status(400).json({ error: `"${field}" is required`, field })
    }
  }

  // Length limits (H5)
  if ((first_name as string).trim().length > 100) {
    return res.status(400).json({ error: '"first_name" must be 100 characters or fewer', field: 'first_name' })
  }
  if ((last_name as string).trim().length > 100) {
    return res.status(400).json({ error: '"last_name" must be 100 characters or fewer', field: 'last_name' })
  }
  if (typeof email !== 'string' || email.length > 254 || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Invalid email address', field: 'email' })
  }

  if (reason !== undefined && reason !== null) {
    if (typeof reason !== 'string') {
      return res.status(400).json({ error: '"reason" must be a string', field: 'reason' })
    }
    if (reason.length > 500) {
      return res.status(400).json({ error: '"reason" must be 500 characters or fewer', field: 'reason' })
    }
  }

  if (typeof start_time !== 'string') {
    return res.status(400).json({ error: '"start_time" must be a string', field: 'start_time' })
  }

  const startDate = new Date(start_time)
  if (isNaN(startDate.getTime())) {
    return res.status(400).json({ error: '"start_time" must be a valid ISO datetime string', field: 'start_time' })
  }

  if (startDate <= new Date()) {
    return res.status(400).json({ error: '"start_time" must be in the future', field: 'start_time' })
  }

  // All business-rule checks use the local time in config.timezone (H3)
  const { datePart, timePart, localMinute, dayOfWeek } = toTZParts(startDate, config.timezone)

  if (timePart < config.openTime || timePart >= config.closeTime) {
    return res.status(400).json({
      error: `Appointment must be between ${config.openTime} and ${config.closeTime}`,
      field: 'start_time',
    })
  }
  if (timePart >= config.lunchStart && timePart < config.lunchEnd) {
    return res.status(400).json({
      error: `Appointment cannot be during lunch break (${config.lunchStart}–${config.lunchEnd})`,
      field: 'start_time',
    })
  }

  // Slot-alignment: time must land on a slot boundary (H4)
  if (localMinute % config.slotDurationMins !== 0) {
    return res.status(400).json({
      error: `Appointment time must align to a ${config.slotDurationMins}-minute slot boundary`,
      field: 'start_time',
    })
  }

  // Day-of-week check uses tz-local day, not server-local day (H3)
  if (!config.workDays.includes(dayOfWeek)) {
    return res.status(400).json({
      error: 'Appointments are not available on this day of the week',
      field: 'start_time',
    })
  }

  // Blocked date check uses tz-local date string (H3)
  const blocked = db.prepare('SELECT date FROM blocked_dates WHERE date = ?').get(datePart)
  if (blocked) {
    return res.status(400).json({
      error: 'This date is not available (public holiday or blocked)',
      field: 'start_time',
    })
  }

  // Normalise to canonical "YYYY-MM-DDTHH:MM:00" in config.timezone before storing (H4)
  const normalizedStartTime = `${datePart}T${timePart}:00`

  const cancellation_token = randomUUID()

  try {
    db.prepare(
      `INSERT INTO appointments (cancellation_token, first_name, last_name, email, reason, start_time)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(
      cancellation_token,
      (first_name as string).trim(),
      (last_name as string).trim(),
      (email as string).trim(),
      typeof reason === 'string' ? reason : null,
      normalizedStartTime,
    )
  } catch (err: unknown) {
    const sqliteErr = err as { code?: string }
    if (typeof sqliteErr.code === 'string' && sqliteErr.code.startsWith('SQLITE_CONSTRAINT')) {
      return res.status(409).json({ error: 'This slot is already booked' })
    }
    throw err
  }

  io.emit('slot:booked', { date: datePart, time: timePart })

  if (config.webhookUrl) {
    fireWebhook(config.webhookUrl, {
      event: 'booked',
      cancellation_token,
      start_time: normalizedStartTime,
      first_name: (first_name as string).trim(),
      last_name: (last_name as string).trim(),
      email: (email as string).trim(),
      reason: typeof reason === 'string' ? reason : null,
    })
  }

  sendBookingConfirmation({
    to: (email as string).trim(),
    firstName: (first_name as string).trim(),
    lastName: (last_name as string).trim(),
    startTime: normalizedStartTime,
    cancellationToken: cancellation_token,
  })

  return res.status(201).json({
    cancellation_token,
    start_time: normalizedStartTime,
    first_name: (first_name as string).trim(),
    last_name: (last_name as string).trim(),
    email: (email as string).trim(),
    reason: typeof reason === 'string' ? reason : null,
  })
})

// GET /:token — returns only display fields; email/id/created_at are not exposed (C2)
router.get('/:token', tokenLimiter, (req: Request, res: Response) => {
  const { token } = req.params

  const appointment = db
    .prepare(
      `SELECT cancellation_token, first_name, last_name, start_time, cancelled, reason
       FROM appointments WHERE cancellation_token = ?`,
    )
    .get(token) as
    | Pick<AppointmentRow, 'cancellation_token' | 'first_name' | 'last_name' | 'start_time' | 'cancelled' | 'reason'>
    | undefined

  if (!appointment) {
    return res.status(404).json({ error: 'Appointment not found' })
  }

  return res.json(appointment)
})

// DELETE /:token
router.delete('/:token', tokenLimiter, (req: Request, res: Response) => {
  const { token } = req.params

  const appointment = db
    .prepare(
      `SELECT cancellation_token, start_time, cancelled
       FROM appointments WHERE cancellation_token = ?`,
    )
    .get(token) as Pick<AppointmentRow, 'cancellation_token' | 'start_time' | 'cancelled'> | undefined

  if (!appointment) {
    return res.status(404).json({ error: 'Appointment not found' })
  }

  if (appointment.cancelled === 1) {
    return res.status(200).json({ message: 'Already cancelled' })
  }

  // Use timezone-aware UTC conversion so the deadline is correct regardless of server timezone (H3)
  const appointmentUTC = localToUTC(appointment.start_time, config.timezone)
  const msUntilAppointment = appointmentUTC.getTime() - Date.now()
  if (msUntilAppointment < config.cancelDeadlineHours * 3600 * 1000) {
    return res.status(422).json({
      error: `Cannot cancel within ${config.cancelDeadlineHours}h of appointment`,
    })
  }

  db.prepare('UPDATE appointments SET cancelled = 1 WHERE cancellation_token = ?').run(token)

  // start_time is stored as normalised "YYYY-MM-DDTHH:MM:00", so substring is safe here
  const date = appointment.start_time.substring(0, 10)
  const time = appointment.start_time.substring(11, 16)
  io.emit('slot:freed', { date, time })

  if (config.webhookUrl) {
    fireWebhook(config.webhookUrl, {
      event: 'cancelled',
      cancellation_token: token,
      start_time: appointment.start_time,
    })
  }

  // Re-fetch email for cancellation notification (not stored in the token-lookup result)
  const full = db.prepare('SELECT first_name, email FROM appointments WHERE cancellation_token = ?').get(token) as
    | Pick<AppointmentRow, 'first_name' | 'email'>
    | undefined

  if (full) {
    sendCancellationConfirmation({
      to: full.email,
      firstName: full.first_name,
      startTime: appointment.start_time,
    })
  }

  return res.status(200).json({ message: 'Appointment cancelled' })
})

// GET /:token/ical — returns an .ics calendar file for the appointment
router.get('/:token/ical', tokenLimiter, (req: Request, res: Response) => {
  const { token } = req.params

  const appointment = db
    .prepare(
      `SELECT first_name, last_name, start_time, cancelled
       FROM appointments WHERE cancellation_token = ?`,
    )
    .get(token) as Pick<AppointmentRow, 'first_name' | 'last_name' | 'start_time' | 'cancelled'> | undefined

  if (!appointment || appointment.cancelled === 1) {
    return res.status(404).json({ error: 'Appointment not found' })
  }

  // Convert stored local time to UTC and format as iCal UTC stamp "YYYYMMDDTHHMMSSZ"
  // Using UTC avoids VTIMEZONE block dependency — universally supported by all calendar apps
  function toICalUtc(localStr: string): string {
    const utc = localToUTC(localStr, config.timezone)
    return utc.toISOString().replace(/[-:.]/g, '').substring(0, 15) + 'Z'
  }

  // Add slotDurationMins to produce DTEND local string, then convert to UTC
  function addMinutes(localStr: string, mins: number): string {
    const [dp, tp] = localStr.split('T')
    const [h, m] = tp.split(':').map(Number)
    const total = h * 60 + m + mins
    const nh = Math.floor(total / 60) % 24
    const nm = total % 60
    return `${dp}T${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}:00`
  }

  const dtStart = toICalUtc(appointment.start_time)
  const dtEnd = toICalUtc(addMinutes(appointment.start_time, config.slotDurationMins))
  const now = new Date().toISOString().replace(/[-:.]/g, '').substring(0, 15) + 'Z'
  const summary = `${appointment.first_name} ${appointment.last_name}`

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//schedule-appointment//v1//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${token}@schedule-appointment`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:Cancellation token: ${token}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="appointment-${token.substring(0, 8)}.ics"`)
  return res.send(ics)
})

export default router
