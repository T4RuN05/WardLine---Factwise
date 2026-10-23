import { diffDays, subDays } from './dates.js';

/**
 * Computes discharge eligibility and fever-free streak (DIS-1, DIS-2, DIS-8).
 *
 * @param {Array} activeReadings Array of active readings: { date: 'YYYY-MM-DD', isFever: boolean, valueC: number }
 * @param {string} today Facility date string 'YYYY-MM-DD'
 * @param {object} settings { requiredFeverFreeDays: 3, ... }
 */
export function computeStreak(activeReadings = [], today, settings = { requiredFeverFreeDays: 3 }) {
  const requiredDays = settings.requiredFeverFreeDays ?? 3;

  // Filter only active readings and map by date
  const byDate = new Map();
  for (const r of activeReadings) {
    if (r.isActive !== false) {
      byDate.set(r.date, r);
    }
  }

  const dates = [...byDate.keys()].sort();
  const latest = dates.length > 0 ? dates[dates.length - 1] : null;

  // Build slot details for the last requiredDays leading up to today
  const slotDays = [];
  for (let i = requiredDays - 1; i >= 0; i--) {
    const slotDate = subDays(today, i);
    const reading = byDate.get(slotDate);
    let state = 'missing';
    if (reading) {
      state = reading.isFever ? 'fever' : 'afebrile';
    }
    slotDays.push({
      date: slotDate,
      state,
      valueC: reading?.valueC ?? null,
    });
  }

  // Stale check: if no readings exist or latest reading is older than yesterday
  if (!latest || diffDays(today, latest) > 1) {
    return {
      length: 0,
      days: slotDays,
      eligible: false,
      stale: true,
      eligibleOn: null,
      latestReadingDate: latest,
    };
  }

  // Count consecutive afebrile days walking backward from latest reading
  let length = 0;
  let cursor = latest;
  let eligibleOn = null;

  while (true) {
    const reading = byDate.get(cursor);
    // Missing date or fever breaks the streak
    if (!reading || reading.isFever) {
      break;
    }
    length += 1;
    if (length === requiredDays) {
      // The day this streak hit the required threshold
      eligibleOn = latest;
    }
    cursor = subDays(cursor, 1);
  }

  const eligible = length >= requiredDays;

  return {
    length,
    days: slotDays,
    eligible,
    eligibleOn: eligible ? (eligibleOn || latest) : null,
    stale: false,
    latestReadingDate: latest,
  };
}
