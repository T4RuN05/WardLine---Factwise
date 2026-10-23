import { env } from '../config/env.js';
import { getFacilityDate } from '../domain/dates.js';

export function getNow(settings = {}) {
  if (env.DEMO_MODE && settings?.demoClockNow) {
    return new Date(settings.demoClockNow);
  }
  return new Date();
}

export function getToday(settings = {}) {
  const now = getNow(settings);
  const timezone = settings?.facilityTimezone || env.FACILITY_TIMEZONE;
  return getFacilityDate(now, timezone);
}
