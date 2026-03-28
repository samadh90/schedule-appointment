import type { AppConfig, Slot, SlotStatus } from '../types'

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60).toString().padStart(2, '0')
  const m = (mins % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

export function generateSlots(
  date: string,
  config: AppConfig,
  bookedTimes: string[],
  isBlocked: boolean
): Slot[] {
  const now = new Date()
  const slots: Slot[] = []
  const open = timeToMinutes(config.openTime)
  const close = timeToMinutes(config.closeTime)
  const lunchStart = timeToMinutes(config.lunchStart)
  const lunchEnd = timeToMinutes(config.lunchEnd)

  for (let t = open; t < close; t += config.slotDurationMins) {
    const timeStr = minutesToTime(t)
    const slotDatetime = new Date(`${date}T${timeStr}:00`)
    let status: SlotStatus

    if (isBlocked) {
      status = 'blocked'
    } else if (t >= lunchStart && t < lunchEnd) {
      status = 'lunch'
    } else if (slotDatetime <= now) {
      status = 'past'
    } else if (bookedTimes.includes(timeStr)) {
      status = 'booked'
    } else {
      status = 'free'
    }

    slots.push({ time: timeStr, status })
  }

  return slots
}
