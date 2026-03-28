import { Router, Request, Response } from 'express'
import db from '../db'

const router = Router()

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

router.get('/', (req: Request, res: Response) => {
  const { from, to } = req.query

  if (!from || !to) {
    return res.status(400).json({ error: 'Both "from" and "to" query params are required' })
  }
  if (typeof from !== 'string' || !ISO_DATE_RE.test(from)) {
    return res.status(400).json({ error: '"from" must be a valid date in YYYY-MM-DD format' })
  }
  if (typeof to !== 'string' || !ISO_DATE_RE.test(to)) {
    return res.status(400).json({ error: '"to" must be a valid date in YYYY-MM-DD format' })
  }
  if (from > to) {
    return res.status(400).json({ error: '"from" must be less than or equal to "to"' })
  }

  const rows = db
    .prepare('SELECT date, label FROM blocked_dates WHERE date >= ? AND date <= ? ORDER BY date')
    .all(from, to)

  return res.json(rows)
})

export default router
