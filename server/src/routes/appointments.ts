import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import db from '../db';
import { config } from '../config';

const router = Router();

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AppointmentRow {
  id: number;
  cancellation_token: string;
  first_name: string;
  last_name: string;
  email: string;
  reason: string | null;
  start_time: string;
  cancelled: number;
  created_at: string;
}

// GET /by-date?date=YYYY-MM-DD
router.get('/by-date', (req: Request, res: Response) => {
  const { date } = req.query;

  if (!date || typeof date !== 'string' || !ISO_DATE_RE.test(date)) {
    return res.status(400).json({ error: '"date" must be a valid date in YYYY-MM-DD format' });
  }

  const rows = db
    .prepare("SELECT start_time FROM appointments WHERE start_time LIKE ? AND cancelled = 0")
    .all(`${date}%`) as Pick<AppointmentRow, 'start_time'>[];

  return res.json({ slots: rows.map(r => r.start_time) });
});

// POST /
router.post('/', (req: Request, res: Response) => {
  const { first_name, last_name, email, reason, start_time } = req.body as Record<string, unknown>;

  // Required fields
  for (const field of ['first_name', 'last_name', 'email', 'start_time'] as const) {
    if (!req.body[field] || typeof req.body[field] !== 'string' || !(req.body[field] as string).trim()) {
      return res.status(400).json({ error: `"${field}" is required`, field });
    }
  }

  if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Invalid email address', field: 'email' });
  }

  if (reason !== undefined && reason !== null) {
    if (typeof reason !== 'string') {
      return res.status(400).json({ error: '"reason" must be a string', field: 'reason' });
    }
    if (reason.length > 500) {
      return res.status(400).json({ error: '"reason" must be 500 characters or fewer', field: 'reason' });
    }
  }

  if (typeof start_time !== 'string') {
    return res.status(400).json({ error: '"start_time" must be a string', field: 'start_time' });
  }

  const startDate = new Date(start_time);
  if (isNaN(startDate.getTime())) {
    return res.status(400).json({ error: '"start_time" must be a valid ISO datetime string', field: 'start_time' });
  }

  if (startDate <= new Date()) {
    return res.status(400).json({ error: '"start_time" must be in the future', field: 'start_time' });
  }

  // Extract HH:MM for business hours check
  const timePart = start_time.substring(11, 16); // "HH:MM"
  if (timePart < config.openTime || timePart >= config.closeTime) {
    return res.status(400).json({
      error: `Appointment must be between ${config.openTime} and ${config.closeTime}`,
      field: 'start_time',
    });
  }
  if (timePart >= config.lunchStart && timePart < config.lunchEnd) {
    return res.status(400).json({
      error: `Appointment cannot be during lunch break (${config.lunchStart}–${config.lunchEnd})`,
      field: 'start_time',
    });
  }

  // Date not blocked
  const datePart = start_time.substring(0, 10); // "YYYY-MM-DD"
  const blocked = db
    .prepare('SELECT date FROM blocked_dates WHERE date = ?')
    .get(datePart);
  if (blocked) {
    return res.status(400).json({ error: 'This date is not available (public holiday or blocked)', field: 'start_time' });
  }

  const cancellation_token = randomUUID();

  try {
    db.prepare(
      `INSERT INTO appointments (cancellation_token, first_name, last_name, email, reason, start_time)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      cancellation_token,
      (first_name as string).trim(),
      (last_name as string).trim(),
      (email as string).trim(),
      typeof reason === 'string' ? reason : null,
      start_time,
    );
  } catch (err: unknown) {
    const sqliteErr = err as { code?: string };
    if (sqliteErr.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({ error: 'This slot is already booked' });
    }
    throw err;
  }

  return res.status(201).json({
    cancellation_token,
    start_time,
    first_name: (first_name as string).trim(),
    last_name: (last_name as string).trim(),
    email: (email as string).trim(),
    reason: typeof reason === 'string' ? reason : null,
  });
});

// GET /:token
router.get('/:token', (req: Request, res: Response) => {
  const { token } = req.params;

  const appointment = db
    .prepare('SELECT * FROM appointments WHERE cancellation_token = ?')
    .get(token) as AppointmentRow | undefined;

  if (!appointment) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  return res.json(appointment);
});

// DELETE /:token
router.delete('/:token', (req: Request, res: Response) => {
  const { token } = req.params;

  const appointment = db
    .prepare('SELECT * FROM appointments WHERE cancellation_token = ?')
    .get(token) as AppointmentRow | undefined;

  if (!appointment) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  if (appointment.cancelled === 1) {
    return res.status(200).json({ message: 'Already cancelled' });
  }

  const msUntilAppointment = new Date(appointment.start_time).getTime() - Date.now();
  if (msUntilAppointment < config.cancelDeadlineHours * 3600 * 1000) {
    return res.status(422).json({
      error: `Cannot cancel within ${config.cancelDeadlineHours}h of appointment`,
    });
  }

  db.prepare('UPDATE appointments SET cancelled = 1 WHERE cancellation_token = ?').run(token);

  return res.status(200).json({ message: 'Appointment cancelled' });
});

export default router;
