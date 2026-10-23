/**
 * Pure date calculations for facility-local dates and day series.
 * Operates on 'YYYY-MM-DD' formatted strings.
 */

export function parseDateString(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatDateString(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getFacilityDate(instant, timezone = 'Asia/Kolkata') {
  // Use Intl.DateTimeFormat to reliably extract local facility date
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date(instant));
}

export function subDays(dateStr, n) {
  const d = parseDateString(dateStr);
  d.setUTCDate(d.getUTCDate() - n);
  return formatDateString(d);
}

export function addDays(dateStr, n) {
  const d = parseDateString(dateStr);
  d.setUTCDate(d.getUTCDate() + n);
  return formatDateString(d);
}

export function diffDays(dateStrA, dateStrB) {
  const a = parseDateString(dateStrA);
  const b = parseDateString(dateStrB);
  const diffMs = a.getTime() - b.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function lastNDays(todayStr, n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    days.push(subDays(todayStr, i));
  }
  return days;
}
