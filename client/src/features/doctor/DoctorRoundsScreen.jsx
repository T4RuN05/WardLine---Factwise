import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAppData } from '../../state/AppDataContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { StreakDots } from '../../components/ui/StreakDots.jsx';
import { ReasonDialog } from '../../components/ui/ReasonDialog.jsx';
import {
  Stethoscope,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Thermometer,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export function DoctorRoundsScreen() {
  const { overview, refreshOverview } = useAppData();
  const navigate = useNavigate();

  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'READY' | 'AWAITING' | 'DONE' | 'FEVER' | 'ELIGIBLE'
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState({ counts: {}, items: [] });
  const [loading, setLoading] = useState(true);

  // Doctor override temperature modal state
  const [overridePatient, setOverridePatient] = useState(null);
  const [overrideTemp, setOverrideTemp] = useState('38.2');
  const [overrideLoading, setOverrideLoading] = useState(false);

  const loadRounds = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/doctor/rounds', { filter });
      setData(res);
    } catch (err) {
      toast.error(err.message || 'Failed to load doctor rounds.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadRounds();
  }, [loadRounds]);

  const handleConfirmOverride = async (reason) => {
    if (!overridePatient) return;
    setOverrideLoading(true);
    try {
      await api.post(`/patients/${overridePatient.id || overridePatient.patientId}/temperatures/doctor-override`, {
        valueC: parseFloat(overrideTemp),
        reason,
      });
      toast.success(
        `Doctor override recorded (${overrideTemp} °C) for ${overridePatient.name}. Patient is now Ready to Visit.`
      );
      setOverridePatient(null);
      await loadRounds();
      await refreshOverview();
    } catch (err) {
      toast.error(err.message || 'Failed to record override.');
    } finally {
      setOverrideLoading(false);
    }
  };

  let items = data.items || [];
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        String(p.roomNumber).includes(q) ||
        p.mrn.toLowerCase().includes(q)
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-surface-pure rounded-card p-4 border border-line/60 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-brand-ink">Doctor Rounds & Clinical Review</h2>
            <span className="text-xs text-text-muted">· Daily Primary Visit</span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Strict ordering: Critical readings first, discharge-eligible second, fever readings third, followed by ready rooms.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-text-muted">Visits Today:</span>
          <span className="font-bold text-brand-ink tabular-nums">
            {overview?.tasks?.visits?.done ?? 18} of {overview?.rooms?.occupied ?? 74} Done
          </span>
        </div>
      </div>

      {/* Filter Chips row (TSK-2) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
          {[
            { id: 'ALL', label: `All (${data.counts?.total || 74})` },
            { id: 'READY', label: `Ready to Visit (${data.counts?.ready || 0})` },
            { id: 'ELIGIBLE', label: `Discharge Eligible (${data.counts?.eligible || 0})` },
            { id: 'FEVER', label: `Fever Alert (${data.counts?.fever || 0})` },
            { id: 'AWAITING', label: `Awaiting Temp (${data.counts?.awaiting || 0})` },
            { id: 'DONE', label: `Completed (${data.counts?.done || 0})` },
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => setFilter(chip.id)}
              className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                filter === chip.id
                  ? 'bg-brand-ink text-white font-semibold shadow-xs'
                  : 'bg-white text-text-secondary hover:bg-slate-100 border border-line/60'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="relative shrink-0">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-line bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue w-48 md:w-56"
          />
        </div>
      </div>

      {/* Rounds List */}
      <div className="bg-surface-pure rounded-card border border-line/60 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-text-muted text-xs">
            Loading doctor rounds from database...
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-text-muted text-xs">
            No patients match the selected filter.
          </div>
        ) : (
          <div className="divide-y divide-line/40">
            {items.map((patient) => {
              const hasReading = !!patient.todayReading;
              const isFever = patient.todayReading?.isFever;
              const isCritical = patient.todayReading?.isCritical;
              const isEligible = patient.eligibility?.eligible;
              const isApproved = patient.status === 'DISCHARGE_APPROVED';
              const isVisitDone = !!patient.todayVisit;

              return (
                <div
                  key={patient.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  {/* Left: Priority Tag + Room + Identity */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-line flex flex-col items-center justify-center shrink-0">
                      <span className="text-[9px] uppercase font-bold text-text-muted">Room</span>
                      <span className="text-base font-bold text-brand-ink leading-tight tabular-nums">
                        {patient.roomNumber}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {isCritical && (
                          <StatusBadge variant="critical" label="CRITICAL FEVER" icon={ShieldAlert} />
                        )}
                        {isEligible && !isApproved && (
                          <StatusBadge variant="eligible" label="DISCHARGE ELIGIBLE" icon={Sparkles} />
                        )}
                        {isApproved && (
                          <StatusBadge variant="approved" label="DISCHARGE APPROVED" />
                        )}

                        <span className="text-sm font-semibold text-brand-ink">{patient.name}</span>
                        <span className="text-[10px] text-text-muted">
                          {patient.age} {patient.sex} · Ward {patient.ward}
                        </span>
                      </div>

                      <div className="text-xs text-text-secondary mt-1 flex items-center gap-3 flex-wrap">
                        {hasReading ? (
                          <span className="text-[11px] font-medium text-brand-ink">
                            Today: {patient.todayReading.valueC} °C{' '}
                            {isFever ? '(Fever)' : '(Afebrile)'}
                          </span>
                        ) : (
                          <span className="text-[11px] text-text-muted italic">
                            No temperature recorded yet
                          </span>
                        )}

                        <span className="text-slate-300">·</span>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-text-muted">Streak:</span>
                          <StreakDots
                            streakLength={patient.eligibility?.length || 0}
                            days={patient.eligibility?.days}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Visit Status & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="text-right">
                      {isVisitDone ? (
                        <StatusBadge variant="success" label="Visit Complete" icon={CheckCircle2} />
                      ) : hasReading ? (
                        <StatusBadge variant="info" label="Ready to Visit" icon={Clock} />
                      ) : (
                        <StatusBadge variant="pending" label="Awaiting Temperature" />
                      )}
                    </div>

                    {/* Primary Visit Action */}
                    {hasReading ? (
                      <Button
                        variant={isVisitDone ? 'outline' : 'primary'}
                        size="sm"
                        icon={Stethoscope}
                        onClick={() => navigate(`/doctor/visit/${patient.id}`)}
                      >
                        {isVisitDone ? 'View Visit' : 'Log Visit'}
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled
                          title="Needs today's temperature first (TSK-3)"
                        >
                          Visit (Blocked)
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const val = prompt(
                              `Doctor override: Enter temperature for Room ${patient.roomNumber} (${patient.name}):`,
                              '38.2'
                            );
                            if (val && !isNaN(parseFloat(val))) {
                              setOverrideTemp(val);
                              setOverridePatient(patient);
                            }
                          }}
                          title="Doctor override temperature if nursing unavailable (TMP-9)"
                          className="text-brand-blue text-[11px]"
                        >
                          Override
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Doctor Override Reason Modal (TMP-9) */}
      <ReasonDialog
        isOpen={!!overridePatient}
        onClose={() => setOverridePatient(null)}
        onConfirm={handleConfirmOverride}
        title="Doctor Temperature Override"
        description={`Dr. ${overview?.today || ''}: Recording ${overrideTemp} °C for ${overridePatient?.name} (Room ${overridePatient?.roomNumber}). A mandatory reason is required and will be flagged in compliance reports.`}
        placeholder="Enter override reason (e.g. bedside evaluation required immediate temperature check before rounds)..."
        confirmLabel="Record Override Temperature"
        confirmVariant="primary"
        isLoading={overrideLoading}
      />
    </div>
  );
}
