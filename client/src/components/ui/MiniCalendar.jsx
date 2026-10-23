import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn.js';

export function MiniCalendar({ activeDate = new Date(), onSelectDate }) {
  const [viewDate, setViewDate] = useState(new Date(activeDate));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0

  const prevMonthDays = new Date(year, month, 0).getDate();

  const handlePrev = () => setViewDate(new Date(year, month - 1, 1));
  const handleNext = () => setViewDate(new Date(year, month + 1, 1));

  const selectedDay = new Date(activeDate).getDate();
  const isCurrentMonth =
    new Date(activeDate).getFullYear() === year &&
    new Date(activeDate).getMonth() === month;

  const weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  return (
    <div className="bg-white rounded-card p-3 shadow-xs border border-line/40 select-none">
      {/* Month & Nav header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-semibold text-brand-ink">
          {monthNames[month]} {year}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrev}
            className="w-5 h-5 flex items-center justify-center rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            title="Previous month"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <button
            onClick={handleNext}
            className="w-5 h-5 flex items-center justify-center rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            title="Next month"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {weekdays.map((wd, i) => (
          <span
            key={wd}
            className={cn(
              'text-[9px] font-medium',
              i >= 5 ? 'text-[#E3B9DF]' : 'text-slate-400' // Pink weekend labels per reference
            )}
          >
            {wd}
          </span>
        ))}
      </div>

      {/* Calendar dates grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {/* Previous month trailing days */}
        {Array.from({ length: firstDayIndex }).map((_, i) => (
          <span
            key={`prev-${i}`}
            className="text-[10px] text-slate-300 py-0.5"
          >
            {prevMonthDays - firstDayIndex + i + 1}
          </span>
        ))}

        {/* Current month days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const isSelected = isCurrentMonth && dayNum === selectedDay;

          return (
            <button
              key={`day-${dayNum}`}
              onClick={() => onSelectDate?.(new Date(year, month, dayNum))}
              className={cn(
                'text-[10px] font-medium py-0.5 rounded-md transition-colors',
                isSelected
                  ? 'bg-brand-blue text-white font-semibold'
                  : 'text-slate-700 hover:bg-slate-100'
              )}
            >
              {dayNum}
            </button>
          );
        })}
      </div>
    </div>
  );
}
