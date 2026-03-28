export interface Config {
  openTime: string
  closeTime: string
  lunchStart: string
  lunchEnd: string
  slotDurationMins: number
  cancelDeadlineHours: number
  timezone: string
  // 0 = Sunday, 1 = Monday, …, 6 = Saturday
  workDays: number[]
}

const defaultConfig: Config = {
  openTime: '09:00',
  closeTime: '18:00',
  lunchStart: '12:00',
  lunchEnd: '13:00',
  slotDurationMins: 30,
  cancelDeadlineHours: 24,
  timezone: 'Europe/Brussels',
  workDays: [1, 2, 3, 4, 5], // Monday–Friday
}

// TENANT_CONFIG env var (JSON) overrides any field
export const config: Config = process.env.TENANT_CONFIG
  ? { ...defaultConfig, ...JSON.parse(process.env.TENANT_CONFIG) }
  : defaultConfig
