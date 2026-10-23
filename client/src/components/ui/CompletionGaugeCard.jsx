import React from 'react';
import { cn } from '../../lib/cn.js';

export function CompletionGaugeCard({
  title = 'Daily Compliance',
  value = 51,
  unit = '%',
  label = 'Checks Complete',
  breakdown = [
    { label: 'Recorded today', count: 38, color: 'bg-brand-blue' },
    { label: 'Pending checks', count: 36, color: 'bg-[#EDF3FA]' },
    { label: 'Doctor overrides', count: 0, color: 'bg-brand-pink' },
  ],
  className,
}) {
  // SVG Semi-circular Horseshoe Gauge calculation
  const radius = 45;
  const strokeWidth = 10;
  const circumference = Math.PI * radius; // Half-circle
  const strokeDashoffset = circumference - (circumference * Math.min(100, Math.max(0, value))) / 100;

  return (
    <div
      className={cn(
        'bg-surface-pure rounded-card p-4 border border-line/60 flex flex-col justify-between',
        className
      )}
    >
      {/* Header: title and week selector */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[13px] font-semibold text-brand-ink">{title}</span>
        <span className="text-[10px] bg-slate-50 border border-line px-2 py-0.5 rounded-md text-text-secondary font-medium">
          Today ▾
        </span>
      </div>

      {/* Horseshoe Arc Gauge with centered number */}
      <div className="relative flex flex-col items-center justify-center my-2">
        <svg viewBox="0 0 120 70" className="w-32 h-20 overflow-visible">
          {/* Background track arc */}
          <path
            d="M 15,65 A 45,45 0 0,1 105,65"
            fill="none"
            stroke="#EDF3FA"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Filled progress arc */}
          <path
            d="M 15,65 A 45,45 0 0,1 105,65"
            fill="none"
            stroke="#8AADDB"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Centered value and label */}
        <div className="absolute bottom-1 text-center">
          <div className="text-[22px] font-normal text-brand-ink leading-tight tabular-nums">
            {value}
            <span className="text-xs text-text-muted">{unit}</span>
          </div>
          <div className="text-[9px] text-text-muted uppercase tracking-wider font-medium">
            {label}
          </div>
        </div>
      </div>

      {/* 3-Row Category Breakdown Legend */}
      <div className="space-y-1.5 pt-2 border-t border-line/40">
        {breakdown.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className={cn('w-2 h-2 rounded-full', item.color)} />
              <span className="text-text-secondary text-[10px]">{item.label}</span>
            </div>
            <span className="font-semibold text-brand-ink tabular-nums text-[11px]">
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
