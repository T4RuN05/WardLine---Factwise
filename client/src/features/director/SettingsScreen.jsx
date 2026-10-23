import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../state/AuthContext.jsx';
import { useAppData } from '../../state/AppDataContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { toast } from 'sonner';
import {
  Settings,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Save,
  CheckCircle2,
  Lock,
  Thermometer,
  Activity,
  Clock,
  Layers,
} from 'lucide-react';
import { cn } from '../../lib/cn.js';

export function SettingsScreen() {
  const { user } = useAuth();
  const { refetchOverview } = useAppData();

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Editable form state
  const [feverThresholdC, setFeverThresholdC] = useState(38.0);
  const [criticalThresholdC, setCriticalThresholdC] = useState(40.0);
  const [requiredFeverFreeDays, setRequiredFeverFreeDays] = useState(3);
  const [mortalityBenchmarkPercent, setMortalityBenchmarkPercent] = useState(15.0);
  const [mortalityWarningPercent, setMortalityWarningPercent] = useState(12.0);
  const [mortalityMinimumSampleSize, setMortalityMinimumSampleSize] = useState(20);
  const [requireDoctorDischargeApproval, setRequireDoctorDischargeApproval] = useState(true);
  const [approvedNotDischargedSlaHours, setApprovedNotDischargedSlaHours] = useState(4);

  const isDirector = user?.role === 'DIRECTOR';

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/settings');
      const s = res.data.settings || res.data;
      setSettings(s);
      setFeverThresholdC(s.feverThresholdC ?? 38.0);
      setCriticalThresholdC(s.criticalThresholdC ?? 40.0);
      setRequiredFeverFreeDays(s.requiredFeverFreeDays ?? 3);
      setMortalityBenchmarkPercent(Math.round((s.mortalityBenchmarkRate ?? 0.15) * 1000) / 10);
      setMortalityWarningPercent(Math.round((s.mortalityWarningRate ?? 0.12) * 1000) / 10);
      setMortalityMinimumSampleSize(s.mortalityMinimumSampleSize ?? 20);
      setRequireDoctorDischargeApproval(s.requireDoctorDischargeApproval ?? true);
      setApprovedNotDischargedSlaHours(s.approvedNotDischargedSlaHours ?? 4);
    } catch (err) {
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isDirector) return;

    if (!confirm('Apply these clinical threshold and policy changes across the facility?')) {
      return;
    }

    setSaving(true);
    try {
      const payload = {
        feverThresholdC: Number(feverThresholdC),
        criticalThresholdC: Number(criticalThresholdC),
        requiredFeverFreeDays: Number(requiredFeverFreeDays),
        mortalityBenchmarkRate: Number(mortalityBenchmarkPercent) / 100,
        mortalityWarningRate: Number(mortalityWarningPercent) / 100,
        mortalityMinimumSampleSize: Number(mortalityMinimumSampleSize),
        requireDoctorDischargeApproval: Boolean(requireDoctorDischargeApproval),
        approvedNotDischargedSlaHours: Number(approvedNotDischargedSlaHours),
      };

      await api.patch('/api/settings', payload);
      toast.success('Facility settings and clinical thresholds updated successfully');
      await refetchOverview();
      await fetchSettings();
    } catch (err) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !settings) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-text-muted space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin text-brand-blue" />
        <p className="text-xs">Loading facility settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[17px] font-medium text-brand-ink">Facility Configuration & Thresholds</h2>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-50 text-brand-blue border border-brand-blue/20">
              WardLine v1.0
            </span>
          </div>
          <p className="text-[11px] text-text-secondary mt-0.5">
            Clinical cutoff rules, discharge requirements, and mortality safety benchmarks
          </p>
        </div>

        {!isDirector && (
          <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>Read-only: Medical Director permissions required to modify</span>
          </div>
        )}
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-4">
        {/* Section 1: Temperature & Clinical Bounds */}
        <div className="bg-white rounded-card border border-line/60 p-4 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-line/60">
            <Thermometer className="w-4 h-4 text-brand-blue" />
            <h3 className="text-xs font-semibold text-brand-ink uppercase tracking-wider">
              Temperature Thresholds & Bounds (TMP-3, TMP-4)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-text-secondary mb-1">
                Fever Cutoff (°C) *
              </label>
              <input
                type="number"
                step="0.1"
                min="37.0"
                max="39.5"
                disabled={!isDirector}
                value={feverThresholdC}
                onChange={(e) => setFeverThresholdC(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-line rounded-control px-3 py-2 disabled:opacity-60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
              <span className="text-[10px] text-text-muted mt-1 block">
                Standard: 38.0 °C. Readings at or above this value trigger fever flags and reset streak.
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-text-secondary mb-1">
                Critical Cutoff (°C) *
              </label>
              <input
                type="number"
                step="0.1"
                min="39.0"
                max="42.0"
                disabled={!isDirector}
                value={criticalThresholdC}
                onChange={(e) => setCriticalThresholdC(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-line rounded-control px-3 py-2 disabled:opacity-60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
              <span className="text-[10px] text-text-muted mt-1 block">
                Standard: 40.0 °C. Triggers emergency priority sort in Doctor Rounds.
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Discharge Eligibility Rules */}
        <div className="bg-white rounded-card border border-line/60 p-4 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-line/60">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-semibold text-brand-ink uppercase tracking-wider">
              Discharge Protocols & Quarantine Policy (DIS-1, DIS-2)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-text-secondary mb-1">
                Required Consecutive Afebrile Days *
              </label>
              <input
                type="number"
                min="1"
                max="14"
                disabled={!isDirector}
                value={requiredFeverFreeDays}
                onChange={(e) => setRequiredFeverFreeDays(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-line rounded-control px-3 py-2 disabled:opacity-60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
              <span className="text-[10px] text-text-muted mt-1 block">
                Standard: 3 consecutive days below fever cutoff. Missing day breaks streak.
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-text-secondary mb-1">
                Checkout Delay SLA Threshold (Hours) *
              </label>
              <input
                type="number"
                min="1"
                max="24"
                disabled={!isDirector}
                value={approvedNotDischargedSlaHours}
                onChange={(e) => setApprovedNotDischargedSlaHours(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-line rounded-control px-3 py-2 disabled:opacity-60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
              <span className="text-[10px] text-text-muted mt-1 block">
                Standard: 4.0 hours. Flags overdue admin checkout in the discharge queue.
              </span>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 text-xs font-medium text-brand-ink cursor-pointer">
              <input
                type="checkbox"
                disabled={!isDirector}
                checked={requireDoctorDischargeApproval}
                onChange={(e) => setRequireDoctorDischargeApproval(e.target.checked)}
                className="rounded border-line text-brand-blue focus:ring-brand-blue disabled:opacity-60"
              />
              <span>Require Attending Physician Approval before Admin Checkout (DIS-2)</span>
            </label>
            <span className="text-[10px] text-text-muted ml-6 block">
              When checked, two-step protocol applies: Doctor approves discharge, then Admin checks out and frees room.
            </span>
          </div>
        </div>

        {/* Section 3: Mortality Benchmarks & Safety Triggers */}
        <div className="bg-white rounded-card border border-line/60 p-4 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-line/60">
            <Activity className="w-4 h-4 text-critical" />
            <h3 className="text-xs font-semibold text-brand-ink uppercase tracking-wider">
              Mortality Safety Benchmarks (MET-1, MET-2, MET-3)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-text-secondary mb-1">
                Statutory Benchmark Breach (%) *
              </label>
              <input
                type="number"
                step="0.5"
                min="5.0"
                max="50.0"
                disabled={!isDirector}
                value={mortalityBenchmarkPercent}
                onChange={(e) => setMortalityBenchmarkPercent(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-line rounded-control px-3 py-2 disabled:opacity-60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
              <span className="text-[10px] text-text-muted mt-1 block">
                Standard: 15.0%. Exceeding this rate triggers facility-wide BREACH alert.
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-text-secondary mb-1">
                Early Caution Warning (%) *
              </label>
              <input
                type="number"
                step="0.5"
                min="5.0"
                max="30.0"
                disabled={!isDirector}
                value={mortalityWarningPercent}
                onChange={(e) => setMortalityWarningPercent(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-line rounded-control px-3 py-2 disabled:opacity-60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
              <span className="text-[10px] text-text-muted mt-1 block">
                Standard: 12.0%. Triggers WARNING banner for clinical management.
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-text-secondary mb-1">
                Minimum Sample Size (Closed Cases) *
              </label>
              <input
                type="number"
                min="5"
                max="100"
                disabled={!isDirector}
                value={mortalityMinimumSampleSize}
                onChange={(e) => setMortalityMinimumSampleSize(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-line rounded-control px-3 py-2 disabled:opacity-60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
              <span className="text-[10px] text-text-muted mt-1 block">
                Standard: 20 cases. Suppresses alert states when sample size is insufficient.
              </span>
            </div>
          </div>
        </div>

        {/* Save Button for Director */}
        {isDirector && (
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={saving}
              className="gap-1.5 shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Applying Policies...' : 'Save Configuration Changes'}</span>
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
