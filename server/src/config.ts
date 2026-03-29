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
  // Optional — outbound webhook called on booking/cancellation
  webhookUrl?: string
  // Optional — public URL of the SPA (used to build cancel links in emails)
  bookingUrl?: string
  // Optional — customer's main website; CancelView redirects here after cancel
  siteUrl?: string
  // Optional — "From" display name for outbound emails (e.g. "Dr. Smith Dental")
  emailFromName?: string
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

  for (const key of ['webhookUrl', 'bookingUrl', 'siteUrl'] as const) {
    if (key in obj) {
      const v = obj[key]
      if (typeof v !== 'string' || (!v.startsWith('https://') && !v.startsWith('http://'))) {
        throw new Error(`TENANT_CONFIG.${key} must be a valid http/https URL`)
      }
      out[key] = (v as string).replace(/\/$/, '')
    }
  }

  if ('emailFromName' in obj) {
    const v = obj.emailFromName
    if (typeof v !== 'string' || v.trim().length === 0 || v.length > 100) {
      throw new Error('TENANT_CONFIG.emailFromName must be a non-empty string of up to 100 characters')
    }
    out.emailFromName = v as string
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

// SMTP configuration — read directly from env, not from TENANT_CONFIG (operator-level secrets)
export const emailConfig = {
  host: process.env.SMTP_HOST ?? '',
  port: parseInt(process.env.SMTP_PORT ?? '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  user: process.env.SMTP_USER ?? '',
  pass: process.env.SMTP_PASS ?? '',
  from: process.env.EMAIL_FROM ?? '',
  // One of: en | fr | nl | de | ru — defaults to English
  locale: (process.env.EMAIL_LOCALE ?? 'en') as 'en' | 'fr' | 'nl' | 'de' | 'ru',
  // If any required SMTP field is missing, emails are silently skipped
  get enabled(): boolean {
    return !!(this.host && this.user && this.pass && this.from)
  },
}
