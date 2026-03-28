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

// Whitelist of allowed override keys — prevents prototype pollution via TENANT_CONFIG
const ALLOWED_KEYS: (keyof Config)[] = [
  'openTime', 'closeTime', 'lunchStart', 'lunchEnd',
  'slotDurationMins', 'cancelDeadlineHours', 'timezone', 'workDays',
]

function parseTenanConfig(raw: string): Partial<Config> {
  const parsed = JSON.parse(raw)
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('TENANT_CONFIG must be a JSON object')
  }
  const safe: Partial<Config> = {}
  for (const key of ALLOWED_KEYS) {
    if (Object.prototype.hasOwnProperty.call(parsed, key)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (safe as any)[key] = parsed[key]
    }
  }
  return safe
}

// TENANT_CONFIG env var (JSON) overrides any field
export const config: Config = process.env.TENANT_CONFIG
  ? { ...defaultConfig, ...parseTenanConfig(process.env.TENANT_CONFIG) }
  : defaultConfig
