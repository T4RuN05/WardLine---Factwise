import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAuth } from '../../state/AuthContext.jsx';
import { useAppData } from '../../state/AppDataContext.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { StreakDots } from '../../components/ui/StreakDots.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { RecordTemperatureSheet } from '../nurse/RecordTemperatureSheet.jsx';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Thermometer,
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  User,
  Heart,
  FileText,
  Activity,
  History,
  Phone,
  Bed,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { cn } from '../../lib/cn.js';
import { formatDate, formatDateTime } from '../../lib/format.js';

export function PatientProfileScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refetchOverview } = useAppData();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('readings'); // 'readings', 'visits', 'discharges', 'audit'
  const [isRecordTempOpen, setIsRecordTempOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const role = user?.role || 'NURSE';

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/patients/${id}`);
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load patient record');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-text-muted space-y-3">
        <Activity className="w-8 h-8 text-brand-blue animate-pulse" />
        <p className="text-xs">Loading clinical chart...</p>
      </div>
    );
  }

  if (error || !data?.patient) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-fever mx-auto" />
        <h3 className="text-sm font-semibold text-text-primary">Patient Not Found</h3>
        <p className="text-xs text-text-secondary">{error || 'This record could not be loaded.'}</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/patients')}>
          Return to Patient Directory
        </Button>
      </div>
    );
  }

  const { patient, eligibility, readings = [], visits = [], discharges = [], death, auditEvents = [] } = data;

  const isActive = patient.status === 'ADMITTED' || patient.status === 'DISCHARGE_APPROVED';
  const isApproved = patient.status === 'DISCHARGE_APPROVED';
  const isDischarged = patient.status === 'DISCHARGED';
  const isDeceased = patient.status === 'DECEASED';

  const canRecordTemp = (role === 'NURSE' || role === 'DIRECTOR') && isActive;
  const canVisit = (role === 'DOCTOR' || role === 'DIRECTOR') && isActive;
  const canApproveDischarge = (role === 'DOCTOR' || role === 'DIRECTOR') && patient.status === 'ADMITTED' && eligibility?.eligible;
  const canCheckout = (role === 'ADMIN' || role === 'DIRECTOR') && isApproved;

  // Handle Approve Discharge
  const handleApproveDischarge = async () => {
    if (!confirm(`Are you sure you want to approve discharge for ${patient.name}?`)) return;
    setActionLoading(true);
    try {
      await api.post(`/api/patients/${patient._id}/discharge/approve`, {
        notes: 'Discharge approved after completing 3 consecutive afebrile days protocol.',
      });
      toast.success(`Discharge approved for ${patient.name}`);
      await refetchOverview();
      await fetchProfile();
    } catch (err) {
      toast.error(err.message || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Checkout
  const handleCheckout = async () => {
    if (!confirm(`Complete discharge for ${patient.name} and free Room ${patient.roomNumber}?`)) return;
    setActionLoading(true);
    try {
      await api.post(`/api/patients/${patient._id}/discharge/complete`, {
        notes: 'Patient successfully checked out. Bed released for sanitization.',
      });
      toast.success(`Discharge completed for ${patient.name}. Room ${patient.roomNumber} is now free.`);
      await refetchOverview();
      await fetchProfile();
    } catch (err) {
      toast.error(err.message || 'Checkout failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Prepare chart data (reverse readings to chronological order for line chart)
  const chartData = [...readings]
    .filter((r) => r.isActive)
    .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt))
    .map((r) => ({
      date: r.date || formatDate(r.recordedAt),
      time: new Date(r.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: r.valueC,
      isFever: r.isFever,
    }));

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Navigation & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/patients')}
            className="w-8 h-8 rounded-lg border border-line bg-white flex items-center justify-center text-text-muted hover:text-brand-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[18px] font-semibold text-brand-ink">{patient.name}</h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-text-secondary border border-line/60">
                {patient.mrn}
              </span>
            </div>
            <p className="text-[11px] text-text-secondary mt-0.5">
              {patient.age} yrs · {patient.sex} · Phone: {patient.phone} · Admitted {patient.admittedOn || formatDate(patient.admittedAt)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {canRecordTemp && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRecordTempOpen(true)}
              className="gap-1.5 bg-white shadow-xs"
            >
              <Thermometer className="w-3.5 h-3.5 text-brand-blue" />
              <span>Record Temp</span>
            </Button>
          )}

          {canVisit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/doctor/visit/${patient._id}`)}
              className="gap-1.5 bg-white shadow-xs"
            >
              <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
              <span>Doctor Visit</span>
            </Button>
          )}

          {canApproveDischarge && (
            <Button
              variant="primary"
              size="sm"
              disabled={actionLoading}
              onClick={handleApproveDischarge}
              className="gap-1.5 bg-brand-blue hover:bg-brand-blue/90"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approve Discharge</span>
            </Button>
          )}

          {canCheckout && (
            <Button
              variant="primary"
              size="sm"
              disabled={actionLoading}
              onClick={handleCheckout}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Complete Discharge</span>
            </Button>
          )}
        </div>
      </div>

      {/* Patient Vital KPI & Eligibility Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Room / Bed Card */}
        <div className="bg-white rounded-card p-3.5 border border-line/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Quarantine Room
            </span>
            <div className="text-lg font-bold text-brand-ink mt-0.5">
              {patient.roomNumber ? `Room ${String(patient.roomNumber).padStart(2, '0')}` : 'Released'}
            </div>
            <span className="text-[10px] text-text-secondary">
              Ward {patient.roomId?.ward || (patient.roomNumber <= 18 ? 'A' : patient.roomNumber <= 36 ? 'B' : patient.roomNumber <= 55 ? 'C' : 'D')}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-surface-soft-blue flex items-center justify-center text-brand-blue">
            <Bed className="w-5 h-5" />
          </div>
        </div>

        {/* Current Clinical Status Card */}
        <div className="bg-white rounded-card p-3.5 border border-line/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Current Status
            </span>
            <div className="mt-1">
              <StatusBadge
                variant={
                  patient.status === 'ADMITTED'
                    ? 'info'
                    : patient.status === 'DISCHARGE_APPROVED'
                    ? 'eligible'
                    : patient.status === 'DISCHARGED'
                    ? 'success'
                    : 'critical'
                }
                label={
                  patient.status === 'ADMITTED'
                    ? 'Active Inpatient'
                    : patient.status === 'DISCHARGE_APPROVED'
                    ? 'Awaiting Checkout'
                    : patient.status === 'DISCHARGED'
                    ? 'Discharged'
                    : 'Deceased'
                }
              />
            </div>
            <span className="text-[10px] text-text-secondary mt-1 block">
              {patient.status === 'DISCHARGE_APPROVED' ? 'Doctor approval granted' : 'Under medical observation'}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-text-secondary">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* Fever-Free Streak Card */}
        <div className="bg-white rounded-card p-3.5 border border-line/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Afebrile Streak (DIS-1)
            </span>
            <StreakDots current={eligibility?.length || 0} target={eligibility?.required || 3} />
          </div>
          <div className="mt-1">
            <div className="text-lg font-bold text-brand-ink tabular-nums">
              {eligibility?.length || 0} / {eligibility?.required || 3}{' '}
              <span className="text-xs font-normal text-text-secondary">Days</span>
            </div>
            <span className="text-[10px] text-text-secondary">
              {eligibility?.eligible
                ? 'Streak complete · Eligible for discharge'
                : eligibility?.stale
                ? 'Check needed today to confirm streak'
                : 'Consecutive afebrile checks required'}
            </span>
          </div>
        </div>

        {/* Emergency Contact Card */}
        <div className="bg-white rounded-card p-3.5 border border-line/60 flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Emergency Contact
            </span>
            <div className="font-semibold text-xs text-brand-ink mt-0.5 truncate">
              {patient.emergencyContact?.name || 'Not recorded'}
            </div>
            <div className="text-[10px] text-text-secondary truncate">
              {patient.emergencyContact?.relationship || 'Next of kin'} · {patient.emergencyContact?.phone || '—'}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center text-brand-pink shrink-0">
            <Heart className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Temperature Trend Line Chart */}
      <div className="bg-white rounded-card p-4 border border-line/60 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-semibold text-brand-ink">Stay Temperature Trend (°C)</h3>
            <p className="text-[10px] text-text-secondary">
              Fever threshold 38.0 °C marked in dashed red (TMP-3/TMP-4)
            </p>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-text-secondary">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-blue" />
              <span>Normal (&lt;38.0 °C)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-fever" />
              <span>Fever (≥38.0 °C)</span>
            </div>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="h-44 flex items-center justify-center text-text-muted text-xs bg-surface/50 rounded-lg border border-line/40">
            No temperature readings recorded yet.
          </div>
        ) : (
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EBEF" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={{ stroke: '#E8EBEF' }}
                  tick={{ fontSize: 9, fill: '#969DA6' }}
                />
                <YAxis
                  domain={[35.0, 42.0]}
                  ticks={[35.0, 36.5, 38.0, 39.5, 41.0]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 9, fill: '#969DA6' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-brand-ink text-white p-2 rounded-md text-[10px] shadow-lg">
                          <div className="font-semibold">{d.value.toFixed(1)} °C</div>
                          <div className="text-slate-300">{d.date} at {d.time}</div>
                          {d.isFever && <div className="text-brand-pink font-bold mt-0.5">Fever Detected</div>}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine
                  y={38.0}
                  stroke="#C2362B"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{ value: '38.0°C Fever', fill: '#C2362B', fontSize: 9, position: 'right' }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8AADDB"
                  strokeWidth={2.5}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    return (
                      <circle
                        key={`${cx}-${cy}`}
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill={payload.isFever ? '#C2362B' : '#8AADDB'}
                        stroke="#FFFFFF"
                        strokeWidth={1.5}
                      />
                    );
                  }}
                  activeDot={{ r: 6, stroke: '#131315', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Tab Navigation for History Tables */}
      <div className="space-y-3">
        <div className="flex items-center gap-1 border-b border-line pb-2">
          <button
            onClick={() => setActiveTab('readings')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
              activeTab === 'readings'
                ? 'bg-brand-blue text-white shadow-xs'
                : 'text-text-secondary hover:text-brand-ink hover:bg-slate-100'
            )}
          >
            Temperature Readings ({readings.length})
          </button>

          <button
            onClick={() => setActiveTab('visits')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
              activeTab === 'visits'
                ? 'bg-brand-blue text-white shadow-xs'
                : 'text-text-secondary hover:text-brand-ink hover:bg-slate-100'
            )}
          >
            Doctor Visits ({visits.length})
          </button>

          <button
            onClick={() => setActiveTab('discharges')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
              activeTab === 'discharges'
                ? 'bg-brand-blue text-white shadow-xs'
                : 'text-text-secondary hover:text-brand-ink hover:bg-slate-100'
            )}
          >
            Discharge & Outcomes ({discharges.length + (death ? 1 : 0)})
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
              activeTab === 'audit'
                ? 'bg-brand-blue text-white shadow-xs'
                : 'text-text-secondary hover:text-brand-ink hover:bg-slate-100'
            )}
          >
            Audit Trail ({auditEvents.length})
          </button>
        </div>

        {/* Tab 1: Temperature Readings */}
        {activeTab === 'readings' && (
          <div className="bg-white rounded-card border border-line/60 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-line/60 text-[10px] uppercase font-semibold text-text-muted bg-surface/50">
                    <th className="py-2.5 px-4">Date & Time</th>
                    <th className="py-2.5 px-3">Reading (°C)</th>
                    <th className="py-2.5 px-3">Route</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Recorded By</th>
                    <th className="py-2.5 px-4">Notes / Corrections</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/40">
                  {readings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-text-muted">
                        No temperature entries on file.
                      </td>
                    </tr>
                  ) : (
                    readings.map((r) => (
                      <tr
                        key={r._id || r.id}
                        className={cn(
                          'hover:bg-slate-50/80 transition-colors',
                          !r.isActive && 'opacity-50 bg-slate-50/50'
                        )}
                      >
                        <td className="py-3 px-4 text-text-secondary">
                          <div className="font-medium text-brand-ink">{r.date}</div>
                          <div className="text-[10px] text-text-muted">
                            {new Date(r.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={cn(
                              'text-sm font-semibold tabular-nums',
                              r.isCritical
                                ? 'text-critical'
                                : r.isFever
                                ? 'text-fever'
                                : 'text-brand-ink'
                            )}
                          >
                            {r.valueC.toFixed(1)} °C
                          </span>
                        </td>

                        <td className="py-3 px-3 text-[11px] text-text-secondary">
                          {r.route || 'ORAL'}
                        </td>

                        <td className="py-3 px-3">
                          {!r.isActive ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-medium line-through">
                              Superseded
                            </span>
                          ) : r.isCritical ? (
                            <StatusBadge variant="critical" label="Critical (≥40°C)" />
                          ) : r.isFever ? (
                            <StatusBadge variant="fever" label="Fever (≥38°C)" />
                          ) : (
                            <StatusBadge variant="success" label="Normal" />
                          )}
                        </td>

                        <td className="py-3 px-3 text-text-secondary text-[11px]">
                          <div>{r.recordedByName || r.recordedBy?.name || 'Staff'}</div>
                          <div className="text-[9px] uppercase text-text-muted font-bold">
                            {r.recordedByRole || r.recordedBy?.role || 'NURSE'}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-text-secondary text-[11px]">
                          {r.reason ? (
                            <div className="italic text-amber-800">
                              "Reason: {r.reason}"
                            </div>
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Doctor Visits */}
        {activeTab === 'visits' && (
          <div className="bg-white rounded-card border border-line/60 p-4 space-y-3 shadow-xs">
            {visits.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-6">
                No doctor visits conducted yet for this patient stay.
              </p>
            ) : (
              visits.map((v) => (
                <div
                  key={v._id || v.id}
                  className="p-3.5 rounded-lg border border-line/70 bg-surface/30 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-brand-ink">{v.date}</span>
                      <span className="text-text-muted">·</span>
                      <span className="text-text-secondary">
                        Dr. {v.doctorId?.name || v.doctorName || 'Attending Physician'}
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-brand-blue font-medium border border-brand-blue/20">
                      {v.clinicalStatus || 'STABLE'}
                    </span>
                  </div>

                  <p className="text-xs text-text-primary whitespace-pre-wrap leading-relaxed">
                    {v.notes}
                  </p>

                  {v.addenda && v.addenda.length > 0 && (
                    <div className="pt-2 border-t border-line/60 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-text-muted">Addenda:</span>
                      {v.addenda.map((ad, idx) => (
                        <div key={idx} className="text-[11px] text-text-secondary pl-2 border-l-2 border-brand-blue">
                          <span>{ad.note}</span>
                          <span className="text-[9px] text-text-muted block">
                            Added by Dr. {ad.doctorName} on {formatDateTime(ad.addedAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Discharge & Outcomes */}
        {activeTab === 'discharges' && (
          <div className="bg-white rounded-card border border-line/60 p-4 space-y-4 shadow-xs">
            {death && (
              <div className="p-3.5 rounded-lg border border-fever/40 bg-fever-soft text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-fever font-semibold">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Deceased Record Closed (DEC-1)</span>
                </div>
                <p className="text-text-secondary">
                  Recorded by {death.recordedBy?.name || 'Doctor'} on {formatDateTime(death.recordedAt)}
                </p>
                <p className="text-brand-ink font-medium">Cause: {death.cause || 'Acute complications'}</p>
                <p className="text-[10px] text-text-muted">
                  Case was closed, room was freed, and mortality calculation was updated atomically.
                </p>
              </div>
            )}

            {discharges.length === 0 && !death ? (
              <p className="text-xs text-text-muted text-center py-6">
                No discharge approval or checkout events on file for this patient.
              </p>
            ) : (
              discharges.map((d) => (
                <div key={d._id || d.id} className="p-3.5 rounded-lg border border-line bg-surface/30 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-brand-ink">
                      Cycle {d.cycleNumber || 1} · {d.status}
                    </span>
                    <span className="text-[10px] text-text-muted">
                      Approved {formatDateTime(d.approvedAt)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-text-secondary">
                    <div>Approved by: Dr. {d.approvedBy?.name || d.approvedByName || 'Physician'}</div>
                    <div>
                      Completed: {d.completedAt ? `By ${d.completedBy?.name || 'Admin'} at ${formatDateTime(d.completedAt)}` : 'Pending Checkout'}
                    </div>
                  </div>

                  {d.delayHours > 4 && (
                    <div className="p-2 rounded bg-amber-50 text-amber-800 text-[10px] flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Checkout delayed by {d.delayHours.toFixed(1)}h (exceeded 4h SLA).</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: Audit Trail */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-card border border-line/60 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-line/60 text-[10px] uppercase font-semibold text-text-muted bg-surface/50">
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Actor</th>
                    <th className="py-2.5 px-4">Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/40">
                  {auditEvents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-text-muted">
                        No audit events logged for this patient.
                      </td>
                    </tr>
                  ) : (
                    auditEvents.map((evt) => (
                      <tr key={evt._id || evt.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-4 text-text-secondary text-[11px] font-mono">
                          {formatDateTime(evt.at)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-[10px] font-semibold text-brand-blue bg-blue-50 px-2 py-0.5 rounded">
                            {evt.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-text-secondary text-[11px]">
                          {evt.actorName} ({evt.actorRole})
                        </td>
                        <td className="py-2.5 px-4 text-text-primary text-[11px]">
                          {evt.summary}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Bedside Record Temperature Sheet */}
      <RecordTemperatureSheet
        isOpen={isRecordTempOpen}
        onClose={() => setIsRecordTempOpen(false)}
        patient={{
          id: patient._id,
          name: patient.name,
          roomNumber: patient.roomNumber,
        }}
        onSuccess={async () => {
          setIsRecordTempOpen(false);
          await refetchOverview();
          await fetchProfile();
        }}
      />
    </div>
  );
}
