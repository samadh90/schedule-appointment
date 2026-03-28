export interface Config {
  openTime: string;
  closeTime: string;
  lunchStart: string;
  lunchEnd: string;
  slotDurationMins: number;
  cancelDeadlineHours: number;
  timezone: string;
}

const defaultConfig: Config = {
  openTime: "09:00",
  closeTime: "18:00",
  lunchStart: "12:00",
  lunchEnd: "13:00",
  slotDurationMins: 30,
  cancelDeadlineHours: 24,
  timezone: "Europe/Brussels",
};

// TENANT_CONFIG env var (JSON) overrides any field
export const config: Config = process.env.TENANT_CONFIG
  ? { ...defaultConfig, ...JSON.parse(process.env.TENANT_CONFIG) }
  : defaultConfig;
