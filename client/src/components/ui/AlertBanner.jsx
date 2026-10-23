import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { cn } from '../../lib/cn.js';

export function AlertBanner({ mortality, onNavigateAnalytics }) {
  const alertState = mortality?.alertState || mortality?.state;
  if (!mortality || !alertState || alertState === 'NORMAL' || alertState === 'INSUFFICIENT_DATA') {
    return null;
  }

  const isBreach = alertState === 'BREACH';
  const rateText = mortality.rateFormatted || (mortality.ratePercent !== undefined ? `${mortality.ratePercent}%` : '');
  const benchmarkText = mortality.benchmarkFormatted || (mortality.benchmarkPercent !== undefined ? `${mortality.benchmarkPercent}%` : '15%');
  const closedCount = mortality.closedCases ?? mortality.closed ?? 0;

  return (
    <div
      onClick={onNavigateAnalytics}
      className={cn(
        'w-full py-2 px-4 rounded-xl flex items-center justify-between text-xs transition-all cursor-pointer select-none mb-3 border',
        isBreach
          ? 'bg-red-50 text-red-900 border-red-200 hover:bg-red-100'
          : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
      )}
    >
      <div className="flex items-center gap-2">
        {isBreach ? (
          <ShieldAlert className="w-4 h-4 text-fever shrink-0 animate-pulse" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        )}
        <span className="font-semibold">
          {isBreach ? 'BREACH ALERT' : 'QUALITY WARNING'}:
        </span>
        <span>
          Mortality is <strong className="underline tabular-nums">{rateText}</strong> (Benchmark: {benchmarkText}). {mortality.deceased} deaths in {closedCount} closed cases.
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] font-medium opacity-80 hover:opacity-100 underline shrink-0">
        View Director Analytics →
      </div>
    </div>
  );
}
