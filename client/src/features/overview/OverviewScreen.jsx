import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../../state/AppDataContext.jsx';
import { useAuth } from '../../state/AuthContext.jsx';
import { api } from '../../lib/api.js';
import { MetricCard } from '../../components/ui/MetricCard.jsx';
import { MonthlyBarChartCard } from '../../components/ui/MonthlyBarChartCard.jsx';
import { CompletionGaugeCard } from '../../components/ui/CompletionGaugeCard.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { StreakDots } from '../../components/ui/StreakDots.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Thermometer, Stethoscope, ArrowRight, Check, Clock } from 'lucide-react';
import { toast } from 'sonner';

export function OverviewScreen() {
  const { overview } = useAppData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSummaryTable() {
      try {
        const res = await api.get('/nurse/worklist');
        // Combine a few pending and done items for the overview table
        const combined = [...(res.pending || []).slice(0, 4), ...(res.done || []).slice(0, 3)];
        setPatients(combined);
      } catch (err) {
        console.error('Failed to load table:', err);
        toast.error(err.message || 'Failed to load the patient worklist.');
      } finally {
        setLoading(false);
      }
    }
    loadSummaryTable();
  }, []);

  const role = user?.role || 'NURSE';

  return (
    <div className="space-y-4">
      {/* ========================================================= */}
      {/* 1. TOP KPI ROW (Reference Section 5)                      */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: Shift Work Remaining */}
        <MetricCard
          title="Daily Temperature Checks"
          value={overview?.tasks?.temperatures?.pending ?? 36}
          unit="Pending"
          subtext={`Completed ${overview?.tasks?.temperatures?.done ?? 38} of ${overview?.rooms?.occupied ?? 74}`}
          progressPercent={
            overview?.rooms?.occupied
              ? Math.round(((overview?.tasks?.temperatures?.done ?? 38) / overview.rooms.occupied) * 100)
              : 51
          }
          progressColor="bg-brand-blue"
          onAction={() => navigate('/nurse/worklist')}
        />

        {/* Card 2: Bed Capacity & Occupancy (ADM-1) */}
        <MetricCard
          title="Facility Bed Occupancy"
          value={`${overview?.rooms?.occupied ?? 74} / ${overview?.rooms?.total ?? 74}`}
          badgeText={overview?.rooms?.free === 0 ? 'Full (74/74)' : `${overview?.rooms?.free} Free`}
          badgeVariant={overview?.rooms?.free === 0 ? 'warning' : 'success'}
          subtext="Admissions hard-blocked when at capacity"
          progressPercent={Math.round(((overview?.rooms?.occupied ?? 74) / 74) * 100)}
          progressColor={overview?.rooms?.free === 0 ? 'bg-amber-500' : 'bg-emerald-500'}
          onAction={() => navigate('/admin/beds')}
        />

        {/* Card 3: Quality Benchmark & Mortality Rate (MET-1 to MET-4) */}
        <MetricCard
          title="Outcome Benchmark (15% Target)"
          value={`${overview?.mortality?.ratePercent ?? 14.0}%`}
          badgeText={overview?.mortality?.state || 'WARNING'}
          badgeVariant={
            overview?.mortality?.state === 'BREACH'
              ? 'danger'
              : overview?.mortality?.state === 'WARNING'
              ? 'warning'
              : 'success'
          }
          subtext={`${overview?.mortality?.deceased ?? 7} deaths in ${overview?.mortality?.closed ?? 50} closed cases`}
          legend={`Success: ${overview?.mortality?.successRatePercent ?? 86.0}%`}
          onAction={() => navigate('/director/analytics')}
        />
      </div>

      {/* ========================================================= */}
      {/* 2. MIDDLE ANALYTICS ROW (Reference Section 6)             */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Monthly Bar Chart (69% width) */}
        <div className="lg:col-span-8">
          <MonthlyBarChartCard title="Discharge Outcomes & Monthly Trajectory" />
        </div>

        {/* Semicircular Completion Gauge (31% width) */}
        <div className="lg:col-span-4">
          <CompletionGaugeCard
            title="Today's Shift Compliance"
            value={
              overview?.rooms?.occupied
                ? Math.round(((overview?.tasks?.temperatures?.done ?? 38) / overview.rooms.occupied) * 100)
                : 51
            }
            label="Temperatures Recorded"
            breakdown={[
              {
                label: 'Recorded today',
                count: overview?.tasks?.temperatures?.done ?? 38,
                color: 'bg-brand-blue',
              },
              {
                label: 'Pending checks',
                count: overview?.tasks?.temperatures?.pending ?? 36,
                color: 'bg-[#EDF3FA]',
              },
              {
                label: 'Doctor visits logged',
                count: overview?.tasks?.visits?.done ?? 18,
                color: 'bg-[#E3B9DF]',
              },
            ]}
          />
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. LOWER DATA SECTION (Reference Section 7)               */}
      {/* ========================================================= */}
      <div className="bg-surface-pure rounded-card p-4 border border-line/60">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-brand-ink">Today's Patient Worklist</h2>
            <p className="text-[11px] text-text-muted">Real-time status across rooms and wards</p>
          </div>
          <div className="flex w-full md:w-auto flex-wrap items-center gap-2">
            <span className="text-[10px] bg-slate-50 border border-line px-2.5 py-1 rounded-md text-text-secondary font-medium">
              Ward: All ▾
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/nurse/worklist')}
              className="gap-1 text-xs"
            >
              <Thermometer className="w-3.5 h-3.5 text-brand-blue" />
              <span>Nurse Worklist →</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/doctor/rounds')}
              className="gap-1 text-xs"
            >
              <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
              <span>Doctor Rounds →</span>
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line text-text-muted text-[10px] uppercase font-semibold">
                <th className="py-2.5 px-3">Room</th>
                <th className="py-2.5 px-3">Patient</th>
                <th className="py-2.5 px-3">Today's Temp</th>
                <th className="py-2.5 px-3">Fever-Free Streak</th>
                <th className="py-2.5 px-3">Task Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-text-muted">
                    Loading shared worklist from MongoDB Atlas...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-text-muted">
                    No active patients found.
                  </td>
                </tr>
              ) : (
                patients.map((p) => {
                  const initials = p.name
                    ? p.name.split(' ').map((n) => n[0]).join('').substring(0, 2)
                    : 'P';
                  const hasReading = !!p.todayReading;
                  const isFever = p.todayReading?.isFever;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-semibold text-brand-ink tabular-nums">
                        Rm {p.roomNumber}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-slate-100 border border-line text-[10px] font-bold text-slate-700 flex items-center justify-center">
                            {initials}
                          </div>
                          <div>
                            <div className="font-medium text-brand-ink">{p.name}</div>
                            <div className="text-[10px] text-text-muted">
                              {p.age} {p.sex} · MRN {p.mrn}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {hasReading ? (
                          <StatusBadge
                            variant={isFever ? 'fever' : 'neutral'}
                            label={`${p.todayReading.valueC} °C`}
                          />
                        ) : (
                          <span className="text-text-muted text-[11px] italic">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <StreakDots streakLength={hasReading && !isFever ? 1 : 0} />
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge
                          variant={hasReading ? 'success' : 'pending'}
                          label={hasReading ? 'Ready for Doctor' : 'Needs Temp'}
                        />
                      </td>
                      <td className="py-3 px-3 text-right">
                        {role === 'NURSE' && !hasReading ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate('/nurse/worklist')}
                          >
                            Record Temp
                          </Button>
                        ) : role === 'DOCTOR' ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate('/doctor/rounds')}
                          >
                            Review
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/patients/${p.id}`)}
                          >
                            Chart
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
