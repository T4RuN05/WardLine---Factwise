import React from 'react';
import { cn } from '../../lib/cn.js';
import { ArrowUpRight, MoreHorizontal } from 'lucide-react';

export function MetricCard({
  title,
  value,
  unit,
  badgeText,
  badgeVariant = 'success',
  subtext,
  progressPercent = null,
  progressColor = 'bg-brand-blue',
  legend,
  className,
  actionIcon: ActionIcon = ArrowUpRight,
  onAction,
}) {
  return (
    <div
      className={cn(
        'bg-surface-pure rounded-card p-3.5 border border-line/60 flex flex-col justify-between transition-shadow hover:shadow-xs',
        className
      )}
    >
      {/* Header row: title and small action icon */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-text-secondary">{title}</span>
        {onAction ? (
          <button
            onClick={onAction}
            className="text-text-muted hover:text-text-primary p-0.5 rounded transition-colors"
          >
            <ActionIcon className="w-3.5 h-3.5" />
          </button>
        ) : (
          <ActionIcon className="w-3.5 h-3.5 text-text-muted/60" />
        )}
      </div>

      {/* Main KPI value & badge */}
      <div className="my-1.5 flex items-baseline gap-2 flex-wrap">
        <span className="text-[27px] font-normal leading-tight text-brand-ink tabular-nums tracking-tight">
          {value}
        </span>
        {unit && (
          <span className="text-[10px] uppercase font-semibold text-text-muted bg-surface-soft px-1.5 py-0.5 rounded">
            {unit}
          </span>
        )}
        {badgeText && (
          <span
            className={cn(
              'text-[10px] px-2 py-0.5 rounded-full font-medium',
              badgeVariant === 'success' && 'bg-success-soft text-success',
              badgeVariant === 'warning' && 'bg-warning-soft text-amber-700 font-semibold',
              badgeVariant === 'danger' && 'bg-fever-soft text-fever font-semibold',
              badgeVariant === 'info' && 'bg-info-soft text-info',
              badgeVariant === 'neutral' && 'bg-surface-soft text-text-secondary'
            )}
          >
            {badgeText}
          </span>
        )}
      </div>

      {/* Supporting copy / micro progress bar */}
      <div>
        {progressPercent !== null && (
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-1.5">
            <div
              className={cn('h-full rounded-full transition-all duration-500', progressColor)}
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
        )}

        {(subtext || legend) && (
          <div className="flex items-center justify-between text-[10px] text-text-muted">
            {subtext && <span>{subtext}</span>}
            {legend && <span className="font-medium">{legend}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
