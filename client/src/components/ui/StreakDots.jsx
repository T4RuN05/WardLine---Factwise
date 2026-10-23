import React from 'react';
import { cn } from '../../lib/cn.js';

export function StreakDots({
  streakLength,
  requiredDays,
  current,
  target,
  days = [],
  showText = true,
  className,
}) {
  const actualLength = streakLength !== undefined ? streakLength : current ?? 0;
  const actualRequired = requiredDays !== undefined ? requiredDays : target ?? 3;

  // If detailed days array is provided, use actual daily states ('afebrile', 'fever', 'missing')
  const slots = days && days.length === actualRequired
    ? days
    : Array.from({ length: actualRequired }).map((_, idx) => ({
        state: idx < actualLength ? 'afebrile' : 'missing',
        date: null,
      }));

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <div className="flex items-center gap-1" title={`${actualLength} of ${actualRequired} fever-free days`}>
        {slots.map((slot, i) => (
          <span
            key={`dot-${i}`}
            className={cn(
              'w-2 h-2 rounded-full transition-all',
              slot.state === 'afebrile' && 'bg-emerald-600 ring-2 ring-emerald-100',
              slot.state === 'fever' && 'bg-fever ring-2 ring-fever/20',
              slot.state === 'missing' && 'border border-slate-300 bg-transparent'
            )}
            title={slot.date ? `${slot.date}: ${slot.state}` : `Day ${i + 1}`}
          />
        ))}
      </div>
      {showText && (
        <span className="text-[10px] text-text-muted font-medium tabular-nums">
          {actualLength}/{actualRequired}
        </span>
      )}
    </div>
  );
}
