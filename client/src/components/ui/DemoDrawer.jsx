import React, { useState } from 'react';
import { api } from '../../lib/api.js';
import { useAppData } from '../../state/AppDataContext.jsx';
import { Button } from './Button.jsx';
import { ReasonDialog } from './ReasonDialog.jsx';
import {
  Clock,
  FastForward,
  RotateCcw,
  Sparkles,
  X,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

export function DemoDrawer({ isOpen, onClose }) {
  const { overview, refreshOverview } = useAppData();
  const [loadingAction, setLoadingAction] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isOpen) return null;

  const handleAdvanceDay = async (days = 1) => {
    setLoadingAction(`advance-${days}`);
    try {
      const res = await api.post('/demo/advance-day', { days });
      toast.success(`Advanced facility clock by ${days} day(s) to ${res.today}`);
      await refreshOverview();
    } catch (err) {
      toast.error(err.message || 'Failed to advance clock.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAutoFill = async () => {
    setLoadingAction('autofill');
    try {
      const res = await api.post('/demo/auto-fill-today');
      toast.success(res.message || `Auto-filled ${res.count} afebrile readings.`);
      await refreshOverview();
    } catch (err) {
      toast.error(err.message || 'Auto-fill failed.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReset = async (reason) => {
    setLoadingAction('reset');
    try {
      const res = await api.post('/demo/reset');
      toast.success(res.message || 'Database reset to initial seed state.');
      setShowResetConfirm(false);
      await refreshOverview();
    } catch (err) {
      toast.error(err.message || 'Reset failed.');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-blue" />
            <div>
              <h3 className="text-base font-semibold text-brand-ink">Demo & Simulation Tools</h3>
              <p className="text-[11px] text-text-muted">Assessment controls & evaluation walkthrough</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-brand-ink hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Simulated Clock Status */}
        <div className="my-5 p-4 bg-slate-50 rounded-xl border border-line">
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-ink mb-1">
            <Clock className="w-4 h-4 text-brand-blue" />
            <span>Facility Local Date (Asia/Kolkata)</span>
          </div>
          <div className="text-2xl font-bold text-brand-ink tracking-tight tabular-nums">
            {overview?.today || 'Loading...'}
          </div>
          <p className="text-[11px] text-text-secondary mt-1">
            Simulated clock is active. Time rolls over at facility midnight (00:00).
          </p>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              icon={FastForward}
              onClick={() => handleAdvanceDay(1)}
              isLoading={loadingAction === 'advance-1'}
            >
              Advance 1 Day
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={FastForward}
              onClick={() => handleAdvanceDay(3)}
              isLoading={loadingAction === 'advance-3'}
            >
              Advance 3 Days
            </Button>
          </div>
        </div>

        {/* Fast Demonstration Tools */}
        <div className="space-y-3 mb-6">
          <h4 className="text-xs font-semibold uppercase text-text-muted tracking-wider">
            Fast Simulation Actions
          </h4>

          <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100">
            <div className="text-xs font-medium text-brand-blue">Auto-fill Today's Readings</div>
            <p className="text-[11px] text-text-secondary mt-0.5 mb-2.5">
              Populates afebrile readings (36.6–37.1 °C) for all pending patients today to demonstrate streak & eligibility progression.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAutoFill}
              isLoading={loadingAction === 'autofill'}
              className="w-full"
            >
              Auto-fill Pending Readings
            </Button>
          </div>

          <div className="p-3.5 bg-red-50/50 rounded-xl border border-red-100">
            <div className="text-xs font-medium text-fever">Reset Database to Seed State</div>
            <p className="text-[11px] text-text-secondary mt-0.5 mb-2.5">
              Restores 74 occupied rooms, 38 done/36 pending, and initial 14.0% mortality WARNING.
            </p>
            <Button
              variant="danger"
              size="sm"
              icon={RotateCcw}
              onClick={() => setShowResetConfirm(true)}
              className="w-full"
            >
              Reset to Initial Seed
            </Button>
          </div>
        </div>

        {/* 6-Minute Evaluator Script Checklist */}
        <div className="border-t border-line pt-4">
          <h4 className="text-xs font-semibold uppercase text-text-muted tracking-wider mb-2">
            6-Minute Demo Checklist (Section 15.3)
          </h4>
          <ol className="space-y-2 text-[11px] text-text-secondary">
            <li className="flex items-start gap-2">
              <span className="font-bold text-brand-ink">1.</span>
              <span><strong>Nurse:</strong> Record 38.4 °C for pending patient; verify move to Done; test duplicate block; test reason correction.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-brand-ink">2.</span>
              <span><strong>Capacity:</strong> Try admission at 74/74 (blocked); switch to Admin, complete discharge, free room, admit new patient.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-brand-ink">3.</span>
              <span><strong>Doctor:</strong> Review rounds (critical first); visit ready patient; test duplicate visit block (opens addendum).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-brand-ink">4.</span>
              <span><strong>Eligibility:</strong> Check 3/3 streak evidence; approve discharge as Doctor.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-brand-ink">5.</span>
              <span><strong>Admin:</strong> Complete checkout; verify room turns free on Bed Map.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-brand-ink">6.</span>
              <span><strong>Director:</strong> View 14.0% WARNING. As Doctor, record death. Verify 15.7% BREACH banner & audit log.</span>
            </li>
          </ol>
        </div>
      </div>

      <ReasonDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleReset}
        title="Reset Entire Demo Database?"
        description="This will clear and repopulate all 74 rooms, patients, readings, and closed case history to initial seed conditions."
        confirmLabel="Yes, Reset Database"
        confirmVariant="danger"
        isLoading={loadingAction === 'reset'}
      />
    </>
  );
}
