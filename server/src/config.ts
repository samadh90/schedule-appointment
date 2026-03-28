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

const HH_MM_RE = /^\d{2}:\d{2}$/

function validateTenantConfig(raw: unknown): Partial<Config> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('TENANT_CONFIG must be a JSON object')
  }
  const obj = raw as Record<string, unknown>
  const out: Partial<Config> = {}

  for (const key of ['openTime', 'closeTime', 'lunchStart', 'lunchEnd'] as const) {
    if (key in obj) {
      if (typeof obj[key] !== 'string' || !HH_MM_RE.test(obj[key] as string)) {
        throw new Error(`TENANT_CONFIG.${key} must be a "HH:MM" string`)
      }
      out[key] = obj[key] as string
    }
  }

  if ('slotDurationMins' in obj) {
    const v = obj.slotDurationMins
    if (typeof v !== 'number' || !Number.isInteger(v) || v <= 0 || v > 240) {
      throw new Error('TENANT_CONFIG.slotDurationMins must be a positive integer ≤ 240')
    }
    out.slotDurationMins = v
  }

  if ('cancelDeadlineHours' in obj) {
    const v = obj.cancelDeadlineHours
    if (typeof v !== 'number' || v < 0) {
      throw new Error('TENANT_CONFIG.cancelDeadlineHours must be a non-negative number')
    }
    out.cancelDeadlineHours = v
  }

  if ('timezone' in obj) {
    if (typeof obj.timezone !== 'string') {
      throw new Error('TENANT_CONFIG.timezone must be a string')
    }
    try {
      new Intl.DateTimeFormat(undefined, { timeZone: obj.timezone as string })
    } catch {
      throw new Error(`TENANT_CONFIG.timezone "${obj.timezone}" is not a valid IANA timezone`)
    }
    out.timezone = obj.timezone as string
  }

  if ('workDays' in obj) {
    const v = obj.workDays
    if (
      !Array.isArray(v) ||
      !v.every((d: unknown) => typeof d === 'number' && Number.isInteger(d) && d >= 0 && d <= 6)
    ) {
      throw new Error('TENANT_CONFIG.workDays must be an array of integers 0–6')
    }
    out.workDays = v as number[]
  }

  return out
}

function buildConfig(): Config {
  if (!process.env.TENANT_CONFIG) return defaultConfig

  let parsed: unknown
  try {
    parsed = JSON.parse(process.env.TENANT_CONFIG)
  } catch {
    console.error('[config] TENANT_CONFIG contains invalid JSON — server cannot start')
    process.exit(1)
  }

  try {
    const overrides = validateTenantConfig(parsed)
    return { ...defaultConfig, ...overrides }
  } catch (err) {
    console.error(`[config] ${(err as Error).message} — server cannot start`)
    process.exit(1)
  }
}

// TENANT_CONFIG env var (JSON) overrides any field; invalid values crash-fast at startup
export const config: Config = buildConfig()
