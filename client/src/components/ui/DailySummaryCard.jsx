import React from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { AnimatedNumber } from './AnimatedNumber.jsx';

export function DailySummaryCard({ count, label, onClick, className }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-sidebar-raised hover:bg-slate-800 transition-colors rounded-xl px-3 py-2.5 flex items-center justify-between border border-white/5 cursor-pointer select-none animate-in fade-in duration-300',
        className
      )}
    >
      <div className="flex items-baseline gap-2">
        <span className="text-[17px] font-semibold text-brand-blue tabular-nums">
          <AnimatedNumber value={count} />
        </span>
        <span className="text-[11px] font-medium text-slate-200 truncate">
          {label}
        </span>
      </div>
      <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-slate-300">
        <ArrowRight className="w-3 h-3" />
      </div>
    </div>
  );
}
