export function formatTemp(valueC, fahrenheit = false) {
  if (valueC === null || valueC === undefined) return '—';
  if (fahrenheit) {
    const valF = Math.round(((valueC * 9) / 5 + 32) * 10) / 10;
    return `${valF.toFixed(1)} °F`;
  }
  return `${Number(valueC).toFixed(1)} °C`;
}

export const formatTemperature = formatTemp;

export function formatTime(instant) {
  if (!instant) return '—';
  const d = new Date(instant);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(instant) {
  if (!instant) return '—';
  const d = new Date(instant);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(instant) {
  if (!instant) return '—';
  const d = new Date(instant);
  return `${formatDate(d)} ${formatTime(d)}`;
}

export function formatStreak(current = 0, target = 3) {
  return `${current || 0}/${target || 3}`;
}

export function formatMortalityRate(rate = 0) {
  if (rate === null || rate === undefined) return '0.0%';
  return `${(Number(rate) * 100).toFixed(1)}%`;
}

export function getRoomPillColor(status) {
  switch (status) {
    case 'FREE':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'OCCUPIED':
      return 'bg-blue-50 text-brand-blue border-brand-blue/30';
    case 'CLEANING':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'MAINTENANCE':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}
