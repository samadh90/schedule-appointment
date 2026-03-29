export interface AppConfig {
  openTime: string
  closeTime: string
  lunchStart: string
  lunchEnd: string
  slotDurationMins: number
  cancelDeadlineHours: number
  timezone: string
  workDays: number[] // 0=Sun … 6=Sat
  // Optional \u2014 customer's main website; CancelView redirects here after cancel
  siteUrl?: string
  // Optional \u2014 public URL of the SPA (used to build cancel links in emails)
  bookingUrl?: string
  // Optional \u2014 display name used in outbound emails
  emailFromName?: string
}

export interface BlockedDate {
  date: string
  label: string | null
}

export interface Appointment {
  cancellation_token: string
  first_name: string
  last_name: string
  reason?: string
  start_time: string
  cancelled: number
}

export type SlotStatus = 'free' | 'booked' | 'blocked' | 'lunch' | 'past'

export interface Slot {
  time: string // "HH:MM"
  status: SlotStatus
}
