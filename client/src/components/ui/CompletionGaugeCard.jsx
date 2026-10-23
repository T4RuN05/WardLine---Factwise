import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/cn.js';
import { AnimatedNumber } from './AnimatedNumber.jsx';

export function CompletionGaugeCard({
  title = 'Daily Compliance',
  value = 51,
  unit = '%',
  label = 'Temperatures Recorded',
  breakdown = [
    { label: 'Recorded today', count: 38, color: 'bg-brand-blue' },
    { label: 'Pending checks', count: 36, color: 'bg-[#EDF3FA]' },
    { label: 'Doctor overrides', count: 0, color: 'bg-brand-pink' },
  ],
  className,
}) {
  const [isMounted, setIsMounted] = useState(false);

  // Trigger smooth arc fill animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 60);
    return () => clearTimeout(timer);
  }, []);

  // SVG Semi-circular Horseshoe Gauge calculation
  const radius = 45;
  const strokeWidth = 10;
  const circumference = Math.PI * radius; // Half-circle
  const targetOffset = circumference - (circumference * Math.min(100, Math.max(0, value))) / 100;
  const strokeDashoffset = isMounted ? targetOffset : circumference;

  return (
    <div
      className={cn(
        'bg-surface-pure rounded-card p-4 border border-line/60 flex flex-col justify-between animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both',
        className
      )}
    >
      {/* Header: title and week selector */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[13px] font-semibold text-brand-ink">{title}</span>
        <span className="text-[10px] bg-slate-50 border border-line px-2 py-0.5 rounded-md text-text-secondary font-medium select-none">
          Today ▾
        </span>
      </div>

      {/* Horseshoe Arc Gauge with centered number and non-overlapping label */}
      <div className="relative flex flex-col items-center justify-center pt-2 pb-1">
        <svg viewBox="0 0 120 70" className="w-32 h-20 overflow-visible">
          {/* Background track arc */}
          <path
            d="M 15,65 A 45,45 0 0,1 105,65"
            fill="none"
            stroke="#EDF3FA"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Filled progress arc with smooth transition */}
          <path
            d="M 15,65 A 45,45 0 0,1 105,65"
            fill="none"
            stroke="#8AADDB"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 900ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </svg>

        {/* Centered value and clean non-overlapping label */}
        <div className="absolute top-7 text-center pointer-events-none">
          <div className="text-[23px] font-normal text-brand-ink leading-tight tabular-nums tracking-tight">
            <AnimatedNumber value={value} />
            <span className="text-xs text-text-muted">{unit}</span>
          </div>
          <div className="text-[8px] text-text-muted uppercase tracking-wider font-semibold mt-0.5 max-w-[90px] truncate">
            {label}
          </div>
        </div>
      </div>

      {/* 3-Row Category Breakdown Legend with Animated Counts */}
      <div className="space-y-1.5 pt-2.5 mt-1 border-t border-line/40">
        {breakdown.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className={cn('w-2 h-2 rounded-full shrink-0', item.color)} />
              <span className="text-text-secondary text-[10px]">{item.label}</span>
            </div>
            <span className="font-semibold text-brand-ink tabular-nums text-[11px]">
              <AnimatedNumber value={item.count} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
