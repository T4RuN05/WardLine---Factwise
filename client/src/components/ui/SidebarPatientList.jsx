import React from 'react';
import { cn } from '../../lib/cn.js';
import { Check, Clock, Thermometer } from 'lucide-react';

export function SidebarPatientList({ patients = [], onSelectPatient, activePatientId }) {
  if (!patients || patients.length === 0) {
    return (
      <div className="py-4 text-center text-slate-500 text-[11px]">
        No active items
      </div>
    );
  }

  return (
    <div className="space-y-1 overflow-y-auto max-h-[220px] pr-1">
      {patients.map((p) => {
        const initials = p.name
          ? p.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .substring(0, 2)
          : 'P';

        const isSelected = activePatientId === (p.id || p.patientId);

        return (
          <div
            key={p.id || p.patientId || p.roomNumber}
            onClick={() => onSelectPatient?.(p)}
            className={cn(
              'px-2.5 py-2 rounded-lg flex items-center justify-between gap-2 cursor-pointer transition-colors text-left',
              isSelected
                ? 'bg-white/10 text-white'
                : 'hover:bg-white/5 text-slate-300'
            )}
          >
            {/* Avatar tile + Name + Room */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-md bg-white/10 text-white text-[10px] font-semibold flex items-center justify-center shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-white truncate leading-tight">
                  {p.name}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  Rm {p.roomNumber} · {p.sublabel ? p.sublabel : p.todayReading?.valueC != null ? `${p.todayReading.valueC} °C` : 'Pending'}
                </div>
              </div>
            </div>

            {/* State indicator icon */}
            <div className="shrink-0">
              {p.todayReading?.isFever ? (
                <div className="w-2 h-2 rounded-full bg-fever ring-2 ring-fever/20" title="Fever" />
              ) : p.todayReading ? (
                <Check className="w-3.5 h-3.5 text-success" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-slate-500" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
