import React, { useState } from 'react';
import { cn } from '../../lib/cn.js';

export function MonthlyBarChartCard({ title = 'Patient Outcomes', data = [], className }) {
  const [selectedMonth, setSelectedMonth] = useState('Oct');
  const [filterType, setFilterType] = useState('Recovered');

  // 12 months data fixture / live trend data
  const defaultMonths = [
    { month: 'Jan', value: 45, max: 120 },
    { month: 'Feb', value: 68, max: 120 },
    { month: 'Mar', value: 82, max: 120 },
    { month: 'Apr', value: 74, max: 120 },
    { month: 'May', value: 91, max: 120 },
    { month: 'Jun', value: 60, max: 120 },
    { month: 'Jul', value: 78, max: 120 },
    { month: 'Aug', value: 85, max: 120 },
    { month: 'Sep', value: 95, max: 120 },
    { month: 'Oct', value: 112, max: 120 }, // Selected in reference
    { month: 'Nov', value: 70, max: 120 },
    { month: 'Dec', value: 55, max: 120 },
  ];

  const months = data && data.length > 0 ? data : defaultMonths;
  const activeItem = months.find((m) => m.month === selectedMonth) || months[9] || months[0];

  return (
    <div
      className={cn(
        'bg-surface-pure rounded-card p-4 border border-line/60 flex flex-col justify-between',
        className
      )}
    >
      {/* Header: title and small pill filter */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[14px] font-semibold text-brand-ink">{title}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] bg-slate-50 border border-line px-2 py-0.5 rounded-md text-text-secondary font-medium">
            {filterType} ▾
          </span>
          <span className="text-[10px] bg-slate-50 border border-line px-2 py-0.5 rounded-md text-text-secondary font-medium">
            Month ▾
          </span>
        </div>
      </div>

      {/* Bar chart area with pale tracks and selected black tooltip */}
      <div className="relative pt-6 pb-2">
        {/* Selected tooltip */}
        <div className="flex justify-center mb-1">
          <div className="bg-brand-ink text-white text-[10px] font-medium px-2 py-0.5 rounded shadow-sm">
            {activeItem.value} {filterType.toLowerCase()}
          </div>
        </div>

        {/* Bars row */}
        <div className="flex items-end justify-between gap-1.5 h-28 px-1">
          {months.map((m) => {
            const isSelected = m.month === selectedMonth;
            const heightPercent = Math.min(100, Math.max(10, (m.value / (m.max || 120)) * 100));

            return (
              <div
                key={m.month}
                onClick={() => setSelectedMonth(m.month)}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
              >
                {/* Pale background track */}
                <div className="w-full bg-[#EDF3FA] rounded-md h-full flex flex-col justify-end p-0.5 overflow-hidden">
                  {/* Filled bar: dusty blue or near-black for selected */}
                  <div
                    className={cn(
                      'w-full rounded transition-all duration-300',
                      isSelected ? 'bg-brand-ink' : 'bg-brand-blue group-hover:bg-[#7FA3D1]'
                    )}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                {/* Month label */}
                <span
                  className={cn(
                    'text-[9px] mt-1 transition-colors',
                    isSelected ? 'font-bold text-brand-ink' : 'text-text-muted'
                  )}
                >
                  {m.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend below */}
      <div className="flex items-center gap-2 pt-2 border-t border-line/40 text-[10px] text-text-muted">
        <span className="w-2 h-2 rounded-full bg-brand-blue inline-block" />
        <span>Completed Discharges (85% Benchmark Target)</span>
      </div>
    </div>
  );
}
