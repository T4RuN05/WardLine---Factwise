import React from 'react';
import { cn } from '../../lib/cn.js';
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  type = 'button',
  icon: Icon,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none rounded-lg';

  const variants = {
    primary: 'bg-brand text-white hover:bg-brand-light active:bg-brand-dark shadow-sm',
    secondary: 'bg-paper text-ink border border-line hover:bg-white active:bg-paper',
    outline: 'border border-line text-ink hover:bg-paper hover:text-ink',
    danger: 'bg-fever text-white hover:bg-red-700 active:bg-red-800 shadow-sm',
    ghost: 'text-ink hover:bg-black/5 active:bg-black/10',
    ok: 'bg-ok text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm',
  };

  const sizes = {
    sm: 'text-xs h-8 px-3 gap-1.5 min-w-[32px]',
    md: 'text-sm h-10 px-4 gap-2 min-h-[44px]', // 44px min touch target
    lg: 'text-base h-12 px-6 gap-2.5 min-h-[48px]',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
}
