export interface AppConfig {
  openTime: string;
  closeTime: string;
  lunchStart: string;
  lunchEnd: string;
  slotDurationMins: number;
  cancelDeadlineHours: number;
  timezone: string;
}

export interface BlockedDate {
  date: string;
  label: string | null;
}

export interface Appointment {
  id: number;
  cancellation_token: string;
  first_name: string;
  last_name: string;
  email: string;
  reason?: string;
  start_time: string;
  cancelled: number;
  created_at: string;
}

export type SlotStatus = 'free' | 'booked' | 'blocked' | 'lunch' | 'past';

export interface Slot {
  time: string;   // "HH:MM"
  status: SlotStatus;
}
