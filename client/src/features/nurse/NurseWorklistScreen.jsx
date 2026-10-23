import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAppData } from '../../state/AppDataContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { ReasonDialog } from '../../components/ui/ReasonDialog.jsx';
import { RecordTemperatureSheet } from './RecordTemperatureSheet.jsx';
import {
  Thermometer,
  Search,
  Filter,
  UserPlus,
  Edit2,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export function NurseWorklistScreen() {
  const { overview, refreshOverview } = useAppData();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'done' | 'fever'
  const [selectedWard, setSelectedWard] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState({ pending: [], done: [], counts: { pending: 0, done: 0, fever: 0 } });
  const [loading, setLoading] = useState(true);

  // Modals state
  const [recordingPatient, setRecordingPatient] = useState(null);
  const [correctingReading, setCorrectingReading] = useState(null);
  const [correctionLoading, setCorrectionLoading] = useState(false);

  const loadWorklist = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/nurse/worklist', { ward: selectedWard });
      setData(res);
    } catch (err) {
      toast.error(err.message || 'Failed to load nurse worklist.');
    } finally {
      setLoading(false);
    }
  }, [selectedWard]);

  useEffect(() => {
    loadWorklist();
  }, [loadWorklist]);

  // Handle temperature correction (TMP-3)
  const handleConfirmCorrection = async (reason) => {
    if (!correctingReading) return;
    setCorrectionLoading(true);
    try {
      const res = await api.patch(
        `/temperatures/${correctingReading.todayReading.id}/correction`,
        {
          valueC: correctingReading.newTemp,
          reason,
        }
      );
      toast.success(
        `Corrected reading to ${correctingReading.newTemp.toFixed(1)} °C for ${correctingReading.name}`
      );
      if (res.approvalRevoked) {
        toast.error(`Discharge approval for ${correctingReading.name} was auto-revoked.`);
      }
      setCorrectingReading(null);
      await loadWorklist();
      await refreshOverview();
    } catch (err) {
      toast.error(err.message || 'Failed to correct reading.');
    } finally {
      setCorrectionLoading(false);
    }
  };

  // Filter patients based on tab and search
  let currentList = [];
  if (activeTab === 'pending') {
    currentList = data.pending || [];
  } else if (activeTab === 'done') {
    currentList = data.done || [];
  } else if (activeTab === 'fever') {
    currentList = (data.done || []).filter((p) => p.todayReading?.isFever);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    currentList = currentList.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        String(p.roomNumber).includes(q) ||
        p.mrn.toLowerCase().includes(q)
    );
  }

  const totalPatients = (data.counts.pending || 0) + (data.counts.done || 0);
  const progressPercent =
    totalPatients > 0
      ? Math.round(((data.counts.done || 0) / totalPatients) * 100)
      : 0;

  return (
    <div className="space-y-4">
      {/* Top Banner & Progress Header */}
      <div className="bg-surface-pure rounded-card p-4 border border-line/60 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-brand-ink">Nurse Temperature Worklist</h2>
            <span className="text-xs text-text-muted">· Floor Rounds</span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Every patient must have one active temperature check recorded per facility day.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={UserPlus}
            onClick={() => navigate('/patients/new')}
          >
            Admit Patient
          </Button>
        </div>
      </div>

      {/* Progress Strip */}
      <div className="bg-surface-pure rounded-card p-4 border border-line/60">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-brand-ink">
            Temperatures Today: {data.counts.done} of {totalPatients} Completed
          </span>
          <span className="text-brand-blue font-bold tabular-nums">
            {progressPercent}%
          </span>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-blue rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Search, Ward Filters & Category Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Tabs: Pending, Done, Fever */}
        <div className="inline-flex p-1 bg-slate-200/60 rounded-xl gap-1 text-xs font-medium select-none">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'pending'
                ? 'bg-white text-brand-ink shadow-xs font-semibold'
                : 'text-text-secondary hover:text-brand-ink'
            }`}
          >
            Pending ({data.counts.pending})
          </button>
          <button
            onClick={() => setActiveTab('done')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'done'
                ? 'bg-white text-brand-ink shadow-xs font-semibold'
                : 'text-text-secondary hover:text-brand-ink'
            }`}
          >
            Done ({data.counts.done})
          </button>
          <button
            onClick={() => setActiveTab('fever')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'fever'
                ? 'bg-white text-fever shadow-xs font-semibold'
                : 'text-text-secondary hover:text-brand-ink'
            }`}
          >
            Fever Alert ({data.counts.fever})
          </button>
        </div>

        {/* Search and Ward Selector */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search name, room or MRN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-line bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue w-48 md:w-56"
            />
          </div>

          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-line bg-white text-text-secondary focus:outline-none font-medium"
          >
            <option value="ALL">Ward: All (74 Rooms)</option>
            <option value="A">Ward A (Rooms 1–19)</option>
            <option value="B">Ward B (Rooms 20–37)</option>
            <option value="C">Ward C (Rooms 38–56)</option>
            <option value="D">Ward D (Rooms 57–74)</option>
          </select>
        </div>
      </div>

      {/* Patients List Cards / Table */}
      <div className="bg-surface-pure rounded-card border border-line/60 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-text-muted text-xs">
            Loading worklist from database...
          </div>
        ) : currentList.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-success mx-auto opacity-80" />
            <h3 className="text-sm font-semibold text-brand-ink">
              {activeTab === 'pending'
                ? 'All pending temperatures completed for this ward!'
                : 'No patients found matching this filter.'}
            </h3>
            <p className="text-xs text-text-muted">
              {activeTab === 'pending'
                ? 'Switch to the Doctor Rounds list to view visit readiness.'
                : 'Try adjusting your search query or ward selection.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-line/40">
            {currentList.map((patient) => {
              const hasReading = !!patient.todayReading;
              const isFever = patient.todayReading?.isFever;
              const isCritical = patient.todayReading?.isCritical;

              return (
                <div
                  key={patient.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  {/* Room badge + Patient demographics */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-line flex flex-col items-center justify-center shrink-0">
                      <span className="text-[9px] uppercase font-bold text-text-muted">Room</span>
                      <span className="text-base font-bold text-brand-ink leading-tight tabular-nums">
                        {patient.roomNumber}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-brand-ink">
                          {patient.name}
                        </span>
                        <span className="text-[10px] text-text-muted bg-slate-100 px-1.5 py-0.5 rounded">
                          {patient.age} {patient.sex} · {patient.mrn}
                        </span>
                      </div>
                      <div className="text-xs text-text-secondary mt-0.5 flex items-center gap-2">
                        <span>Ward {patient.ward}</span>
                        <span>·</span>
                        {patient.yesterdayReading ? (
                          <span className="text-[11px] text-text-muted">
                            Yesterday:{' '}
                            <strong className="text-brand-ink">
                              {patient.yesterdayReading.valueC} °C
                            </strong>{' '}
                            ({patient.yesterdayReading.isFever ? 'Fever' : 'Afebrile'})
                          </span>
                        ) : (
                          <span className="text-[11px] text-text-muted italic">
                            No reading yesterday
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Temperature Status & Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    {hasReading ? (
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <StatusBadge
                            variant={isCritical ? 'critical' : isFever ? 'fever' : 'neutral'}
                            label={`${patient.todayReading.valueC} °C`}
                            size="md"
                          />
                        </div>
                        <div className="text-[10px] text-text-muted mt-0.5">
                          By {patient.todayReading.recordedByName || 'Nurse'}
                          {patient.todayReading.correctionReason && (
                            <span className="text-brand-blue ml-1 font-medium">(Corrected)</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <StatusBadge variant="pending" label="Needs Temperature" />
                    )}

                    {/* Action Button */}
                    {!hasReading ? (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Thermometer}
                        onClick={() => setRecordingPatient(patient)}
                      >
                        Record Temp
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Edit2}
                        onClick={() => {
                          const newTemp = prompt(
                            `Enter corrected temperature for ${patient.name} (Current: ${patient.todayReading.valueC} °C):`,
                            patient.todayReading.valueC
                          );
                          if (newTemp && !isNaN(parseFloat(newTemp))) {
                            setCorrectingReading({
                              ...patient,
                              newTemp: parseFloat(newTemp),
                            });
                          }
                        }}
                      >
                        Correct
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bedside Record Temperature Sheet */}
      <RecordTemperatureSheet
        isOpen={!!recordingPatient}
        onClose={() => setRecordingPatient(null)}
        patient={recordingPatient}
        onSuccess={async () => {
          await loadWorklist();
          await refreshOverview();
        }}
      />

      {/* Reason for Correction Dialog (TMP-3) */}
      <ReasonDialog
        isOpen={!!correctingReading}
        onClose={() => setCorrectingReading(null)}
        onConfirm={handleConfirmCorrection}
        title="Correct Today's Reading"
        description={`Changing temperature for ${correctingReading?.name} to ${correctingReading?.newTemp?.toFixed(1)} °C. A clinical reason is required.`}
        placeholder="Enter correction reason (e.g. thermometer miscalibration, typographical error)..."
        confirmLabel="Save Correction"
        confirmVariant="primary"
        isLoading={correctionLoading}
      />
    </div>
  );
}
