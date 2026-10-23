import React from 'react';
import { cn } from '../../lib/cn.js';
import { Check, Clock, AlertTriangle, Thermometer, ShieldAlert, Sparkles } from 'lucide-react';

export function StatusBadge({ variant = 'neutral', label, icon: CustomIcon, className, size = 'sm' }) {
  const styles = {
    neutral: 'bg-surface-soft text-text-secondary border-transparent',
    info: 'bg-info-soft text-info border-transparent',
    fever: 'bg-fever-soft text-fever font-medium border-transparent',
    critical: 'bg-critical-soft text-critical font-semibold border-critical/30',
    success: 'bg-success-soft text-success font-medium border-transparent',
    warning: 'bg-warning-soft text-amber-700 font-medium border-transparent',
    pending: 'bg-pending-soft text-text-muted border-transparent',
    eligible: 'bg-[#F5EAF4] text-[#8E44AD] font-medium border-transparent', // Pastel pink/purple accent
    approved: 'bg-emerald-50 text-emerald-700 font-medium border-emerald-200',
  };

  const defaultIcons = {
    fever: Thermometer,
    critical: ShieldAlert,
    success: Check,
    warning: AlertTriangle,
    pending: Clock,
    eligible: Sparkles,
  };

  const IconToRender = CustomIcon || defaultIcons[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] tracking-tight border select-none transition-colors',
        styles[variant] || styles.neutral,
        size === 'xs' && 'text-[9px] px-1.5 py-0',
        size === 'md' && 'text-xs px-2.5 py-1',
        className
      )}
    >
      {IconToRender && <IconToRender className="w-3 h-3 shrink-0" />}
      <span>{label}</span>
    </span>
  );
}
