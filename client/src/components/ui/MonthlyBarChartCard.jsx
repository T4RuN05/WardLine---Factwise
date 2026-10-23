import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/cn.js';

export function MonthlyBarChartCard({ title = 'Patient Outcomes', data = [], className }) {
  const [selectedMonth, setSelectedMonth] = useState('Oct');
  const [filterType, setFilterType] = useState('Recovered');
  const [hoveredItem, setHoveredItem] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const chartContainerRef = useRef(null);

  // Trigger smooth grow animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 60);
    return () => clearTimeout(timer);
  }, []);

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
    { month: 'Oct', value: 112, max: 120 }, // Highlighted in reference
    { month: 'Nov', value: 70, max: 120 },
    { month: 'Dec', value: 55, max: 120 },
  ];

  const months = data && data.length > 0 ? data : defaultMonths;

  const handleMouseMove = (e) => {
    if (!chartContainerRef.current) return;
    const rect = chartContainerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      className={cn(
        'bg-surface-pure rounded-card p-4 border border-line/60 flex flex-col justify-between animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both',
        className
      )}
    >
      {/* Header: title and small pill filter */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[14px] font-semibold text-brand-ink">{title}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] bg-slate-50 border border-line px-2 py-0.5 rounded-md text-text-secondary font-medium select-none">
            {filterType} ▾
          </span>
          <span className="text-[10px] bg-slate-50 border border-line px-2 py-0.5 rounded-md text-text-secondary font-medium select-none">
            Month ▾
          </span>
        </div>
      </div>

      {/* Bar chart area */}
      <div
        ref={chartContainerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredItem(null)}
        className="relative pt-6 pb-1"
      >
        {/* Dynamic Cursor-following Tooltip (Attached to cursor on hover) */}
        {hoveredItem && (
          <div
            className="pointer-events-none absolute z-30 bg-brand-ink text-white text-[10px] font-medium px-2.5 py-1 rounded-md shadow-xl transition-all duration-75 flex flex-col items-center -translate-x-1/2 -translate-y-full"
            style={{
              left: `${mousePos.x}px`,
              top: `${Math.max(18, mousePos.y - 12)}px`,
            }}
          >
            <div className="flex items-center gap-1">
              <span className="font-semibold">{hoveredItem.value}</span>
              <span className="text-slate-300 font-normal">{filterType.toLowerCase()}</span>
            </div>
            <span className="text-[9px] text-slate-400 font-normal">{hoveredItem.month}</span>
            {/* Arrow pointer */}
            <div className="w-1.5 h-1.5 bg-brand-ink rotate-45 -mb-1 mt-0.5" />
          </div>
        )}

        {/* 1. Bars row with pale tracks */}
        <div className="flex items-end justify-between gap-1.5 h-28 px-1">
          {months.map((m, idx) => {
            const isHovered = hoveredItem?.month === m.month;
            const isSelected = selectedMonth === m.month;
            const isHighlighted = isHovered || (!hoveredItem && isSelected);
            const heightPercent = Math.min(100, Math.max(10, (m.value / (m.max || 120)) * 100));

            return (
              <div
                key={m.month}
                onMouseEnter={() => setHoveredItem(m)}
                onClick={() => setSelectedMonth(m.month)}
                className="flex-1 h-full flex flex-col justify-end group cursor-pointer"
              >
                {/* Pale background track */}
                <div className="w-full bg-[#EDF3FA] rounded-md h-full flex flex-col justify-end p-0.5 overflow-hidden">
                  {/* Filled bar with smooth mount wave animation */}
                  <div
                    className={cn(
                      'w-full rounded transition-all ease-out',
                      isHighlighted
                        ? 'bg-brand-ink shadow-xs'
                        : 'bg-brand-blue group-hover:bg-[#7FA3D1]'
                    )}
                    style={{
                      height: isMounted ? `${heightPercent}%` : '0%',
                      transitionDuration: '700ms',
                      transitionDelay: `${idx * 30}ms`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* 2. Distinct Month Labels Row (Prevents chart and legend overlap) */}
        <div className="flex items-center justify-between px-1 mt-2 mb-1">
          {months.map((m) => {
            const isHovered = hoveredItem?.month === m.month;
            const isSelected = selectedMonth === m.month;
            const isHighlighted = isHovered || (!hoveredItem && isSelected);

            return (
              <span
                key={m.month}
                className={cn(
                  'text-[9px] flex-1 text-center transition-colors select-none',
                  isHighlighted ? 'font-bold text-brand-ink' : 'text-text-muted'
                )}
              >
                {m.month}
              </span>
            );
          })}
        </div>
      </div>

      {/* Legend below with clean top margin and divider */}
      <div className="flex items-center gap-2 pt-2.5 mt-1 border-t border-line/40 text-[10px] text-text-muted">
        <span className="w-2 h-2 rounded-full bg-brand-blue inline-block shrink-0" />
        <span>Completed Discharges (85% Benchmark Target)</span>
      </div>
    </div>
  );
}
