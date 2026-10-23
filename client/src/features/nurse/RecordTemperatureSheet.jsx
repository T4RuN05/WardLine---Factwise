import React, { useState } from 'react';
import { Button } from '../../components/ui/Button.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { X, Plus, Minus, Thermometer, AlertTriangle, ShieldAlert } from 'lucide-react';
import { api } from '../../lib/api.js';
import { toast } from 'sonner';

export function RecordTemperatureSheet({
  isOpen,
  onClose,
  patient,
  onSuccess,
}) {
  const [valueC, setValueC] = useState(37.0);
  const [loading, setLoading] = useState(false);
  const [showSoftBoundModal, setShowSoftBoundModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !patient) return null;

  const isFever = valueC >= 38.0;
  const isCritical = valueC >= 40.0;
  const isSoftBound = valueC < 35.0 || valueC >= 41.0;

  const handleStep = (delta) => {
    setErrorMsg('');
    const nextVal = Math.round((valueC + delta) * 10) / 10;
    if (nextVal >= 32.0 && nextVal <= 43.0) {
      setValueC(nextVal);
    }
  };

  const handleSave = async (forceSave = false) => {
    // 1. Hard bound validation (TMP-5)
    if (valueC < 32.0 || valueC > 43.0) {
      setErrorMsg('Enter a temperature between 32.0 and 43.0 °C.');
      return;
    }

    // 2. Soft bound anomaly check (TMP-6)
    if (isSoftBound && !forceSave) {
      setShowSoftBoundModal(true);
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.post(`/patients/${patient.id || patient.patientId}/temperatures`, {
        valueC,
      });

      toast.success(
        `Recorded ${valueC.toFixed(1)} °C for Room ${patient.roomNumber} (${patient.name})`
      );

      if (res.approvalRevoked) {
        toast.error(`Fever recorded! Discharge approval for ${patient.name} was auto-revoked.`);
      }

      onSuccess?.(res);
      onClose();
    } catch (err) {
      if (err.code === 'DUPLICATE_READING') {
        setErrorMsg(err.message);
      } else {
        setErrorMsg(err.message || 'Failed to record temperature.');
      }
      toast.error(err.message || 'Failed to record temperature.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="fixed bottom-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-1/2 md:-translate-x-1/2 left-0 right-0 z-50 bg-white rounded-t-3xl md:rounded-3xl p-6 shadow-2xl border border-line max-w-lg mx-auto animate-in slide-in-from-bottom">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-line">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-brand-blue bg-blue-50 px-2 py-0.5 rounded">
                Room {patient.roomNumber}
              </span>
              <h3 className="text-base font-semibold text-brand-ink">{patient.name}</h3>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              {patient.age} {patient.sex} · MRN: {patient.mrn} · Ward {patient.ward || 'A'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-ink hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Clinical Context Reference */}
        <div className="my-4 p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs border border-line/60">
          <span className="text-text-secondary">Yesterday's active reading:</span>
          {patient.yesterdayReading ? (
            <StatusBadge
              variant={patient.yesterdayReading.isFever ? 'fever' : 'neutral'}
              label={`${patient.yesterdayReading.valueC} °C (${patient.yesterdayReading.isFever ? 'Fever' : 'Afebrile'})`}
            />
          ) : (
            <span className="text-text-muted italic">None recorded</span>
          )}
        </div>

        {/* Large Numeric Input Display */}
        <div className="flex flex-col items-center justify-center my-5">
          <span className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            Today's Reading (°C)
          </span>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleStep(-0.1)}
              className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center text-brand-ink shadow-xs"
            >
              <Minus className="w-5 h-5" />
            </button>

            <div className="px-5 py-2 rounded-2xl bg-slate-50 border border-line flex items-baseline gap-1">
              <input
                type="number"
                step="0.1"
                min="32.0"
                max="43.0"
                value={valueC}
                onChange={(e) => setValueC(parseFloat(e.target.value) || 37.0)}
                className="text-4xl md:text-5xl font-semibold text-brand-ink w-32 text-center bg-transparent focus:outline-none tabular-nums"
              />
              <span className="text-xl font-medium text-text-muted">°C</span>
            </div>

            <button
              type="button"
              onClick={() => handleStep(+0.1)}
              className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center text-brand-ink shadow-xs"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Live Classification Badge Preview */}
          <div className="mt-3">
            {isCritical ? (
              <StatusBadge
                variant="critical"
                label="CRITICAL FEVER (≥ 40.0 °C)"
                icon={ShieldAlert}
                size="md"
              />
            ) : isFever ? (
              <StatusBadge
                variant="fever"
                label="FEVER (≥ 38.0 °C)"
                icon={Thermometer}
                size="md"
              />
            ) : (
              <StatusBadge
                variant="success"
                label="AFEBRILE (< 38.0 °C)"
                size="md"
              />
            )}
          </div>

          {/* Quick preset chips */}
          <div className="flex items-center gap-2 mt-4">
            {[36.8, 37.0, 37.4, 38.4, 39.2].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setValueC(preset)}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium tabular-nums transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>

          {errorMsg && (
            <div className="w-full mt-3 p-2.5 bg-red-50 text-fever text-xs rounded-lg border border-red-200">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-line">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => handleSave(false)}
            isLoading={loading}
            className="px-6"
          >
            Save Temperature
          </Button>
        </div>
      </div>

      {/* Soft Bound Confirmation Dialog (TMP-6) */}
      <Modal
        isOpen={showSoftBoundModal}
        onClose={() => setShowSoftBoundModal(false)}
        title="Unusual Temperature Reading"
        description="Please confirm after verifying thermometer placement."
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900">
              <strong className="text-sm font-semibold">{valueC.toFixed(1)} °C</strong> is unusual. Check the thermometer, then confirm to save.
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowSoftBoundModal(false)}
            >
              Re-enter
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setShowSoftBoundModal(false);
                handleSave(true);
              }}
            >
              Confirm & Save {valueC.toFixed(1)} °C
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
