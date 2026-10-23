import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAppData } from '../../state/AppDataContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { StreakDots } from '../../components/ui/StreakDots.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { ReasonDialog } from '../../components/ui/ReasonDialog.jsx';
import {
  ArrowLeft,
  Stethoscope,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Thermometer,
  Calendar,
  FileText,
  Clock,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

export function DoctorVisitScreen() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { overview, refreshOverview } = useAppData();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Visit form state
  const [clinicalStatus, setClinicalStatus] = useState('STABLE');
  const [notes, setNotes] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  // Addendum state
  const [addendumText, setAddendumText] = useState('');
  const [addendumLoading, setAddendumLoading] = useState(false);

  // Discharge approval dialog
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);

  // Discharge revoke dialog
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [revokeLoading, setRevokeLoading] = useState(false);

  // Record death dialog (DEC-1, DEC-2)
  const [showDeathModal, setShowDeathModal] = useState(false);
  const [deathRoomInput, setDeathRoomInput] = useState('');
  const [deathCauseNote, setDeathCauseNote] = useState('');
  const [deathLoading, setDeathLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/patients/${patientId}`);
      setProfile(res);
      // Pre-fill existing visit if present
      const today = overview?.today;
      const existingVisit = (res.visits || []).find((v) => v.date === today);
      if (existingVisit) {
        setClinicalStatus(existingVisit.clinicalStatus);
        setNotes(existingVisit.notes);
        setTreatmentPlan(existingVisit.treatmentPlan || '');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load patient profile.');
    } finally {
      setLoading(false);
    }
  }, [patientId, overview?.today]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) {
    return <div className="p-12 text-center text-text-muted text-xs">Loading patient chart...</div>;
  }
  if (!profile) {
    return <div className="p-12 text-center text-text-muted text-xs">Patient not found.</div>;
  }

  const { patient, eligibility, readings = [], visits = [], discharges = [] } = profile;
  const today = overview?.today;
  const todayReading = readings.find((r) => r.date === today && r.isActive);
  const todayVisit = visits.find((v) => v.date === today);
  const isApproved = patient.status === 'DISCHARGE_APPROVED';
  const isClosed = patient.status === 'DISCHARGED' || patient.status === 'DECEASED';

  // Save primary visit (VIS-1 to VIS-7)
  const handleSaveVisit = async (e) => {
    e.preventDefault();
    if (!notes.trim()) {
      toast.error('Please enter clinical visit notes.');
      return;
    }

    setSaveLoading(true);
    try {
      await api.post(`/patients/${patient.id || patient._id}/visits`, {
        clinicalStatus,
        notes: notes.trim(),
        treatmentPlan: treatmentPlan.trim(),
      });
      toast.success(`Daily visit logged for Room ${patient.roomNumber} (${patient.name})`);
      await loadProfile();
      await refreshOverview();
    } catch (err) {
      toast.error(err.message || 'Failed to save visit.');
    } finally {
      setSaveLoading(false);
    }
  };

  // Add addendum (VIS-3)
  const handleAddAddendum = async () => {
    if (!addendumText.trim() || !todayVisit) return;
    setAddendumLoading(true);
    try {
      await api.post(`/visits/${todayVisit.id || todayVisit._id}/addenda`, {
        text: addendumText.trim(),
      });
      toast.success('Addendum appended to today\'s visit.');
      setAddendumText('');
      await loadProfile();
    } catch (err) {
      toast.error(err.message || 'Failed to append addendum.');
    } finally {
      setAddendumLoading(false);
    }
  };

  // Approve discharge (DIS-3)
  const handleApproveDischarge = async () => {
    setApproveLoading(true);
    try {
      await api.post(`/patients/${patient.id || patient._id}/discharge/approve`);
      toast.success(`Discharge approved for ${patient.name}! Moved to Admin checkout queue.`);
      setShowApproveModal(false);
      await loadProfile();
      await refreshOverview();
    } catch (err) {
      toast.error(err.message || 'Discharge approval failed.');
    } finally {
      setApproveLoading(false);
    }
  };

  // Revoke discharge (DIS-6)
  const handleRevokeDischarge = async (reason) => {
    setRevokeLoading(true);
    try {
      await api.post(`/patients/${patient.id || patient._id}/discharge/revoke`, { reason });
      toast.success(`Discharge approval revoked for ${patient.name}.`);
      setShowRevokeDialog(false);
      await loadProfile();
      await refreshOverview();
    } catch (err) {
      toast.error(err.message || 'Revocation failed.');
    } finally {
      setRevokeLoading(false);
    }
  };

  // Record death (DEC-1, DEC-2)
  const handleRecordDeath = async () => {
    if (Number(deathRoomInput) !== Number(patient.roomNumber)) {
      toast.error(`Please type room number ${patient.roomNumber} exactly to confirm.`);
      return;
    }
    if (!deathCauseNote.trim()) {
      toast.error('Cause of death note is required.');
      return;
    }

    setDeathLoading(true);
    try {
      const res = await api.post(`/patients/${patient.id || patient._id}/death`, {
        confirmRoomNumber: deathRoomInput,
        causeNote: deathCauseNote.trim(),
      });

      toast.success(`Recorded death for ${patient.name}. Room ${patient.roomNumber} is now free.`);

      if (res.metrics?.state === 'BREACH') {
        toast.error(`CRITICAL ALERT: Mortality breached 15% benchmark (${res.metrics.ratePercent}%).`);
      }

      setShowDeathModal(false);
      navigate('/doctor/rounds');
      await refreshOverview();
    } catch (err) {
      toast.error(err.message || 'Failed to record death.');
    } finally {
      setDeathLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Back button & Patient Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          icon={ArrowLeft}
          onClick={() => navigate('/doctor/rounds')}
        >
          Back to Doctor Rounds
        </Button>

        <div className="flex items-center gap-2">
          {isApproved && (
            <StatusBadge variant="approved" label="Discharge Approved (Waiting Checkout)" />
          )}
          {isClosed && (
            <StatusBadge variant="neutral" label={`Case Closed (${patient.status})`} />
          )}
        </div>
      </div>

      {/* Two-Column Clinical Layout (Reference Section 9.6) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ========================================================= */}
        {/* LEFT COLUMN: Read-only Clinical Context & Chart           */}
        {/* ========================================================= */}
        <div className="lg:col-span-6 space-y-4">
          {/* Patient Identity Card */}
          <div className="bg-surface-pure rounded-card p-4 border border-line/60">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-bold text-brand-blue bg-blue-50 px-2 py-0.5 rounded">
                    Room {patient.roomNumber}
                  </span>
                  <h2 className="text-lg font-semibold text-brand-ink">{patient.name}</h2>
                </div>
                <p className="text-xs text-text-muted mt-1">
                  {patient.age} years · {patient.sex} · MRN {patient.mrn} · Ward {patient.roomId?.ward || 'A'}
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  Admitted: <strong>{patient.admittedOn}</strong> · Contact: {patient.phone}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-text-muted block">Status</span>
                <span className="text-xs font-semibold text-brand-ink">{patient.status}</span>
              </div>
            </div>

            {/* Today's Reading Highlight */}
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-line/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-brand-blue" />
                <span className="text-xs text-text-secondary">Today's Temperature:</span>
              </div>
              {todayReading ? (
                <StatusBadge
                  variant={todayReading.isCritical ? 'critical' : todayReading.isFever ? 'fever' : 'neutral'}
                  label={`${todayReading.valueC} °C (${todayReading.isFever ? 'Fever' : 'Afebrile'})`}
                  size="md"
                />
              ) : (
                <span className="text-xs text-fever font-medium">Missing today</span>
              )}
            </div>

            {/* Fever-Free Streak Evidence */}
            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-line/60 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium block">
                  3-Day Fever-Free Run:
                </span>
                <span className="text-[11px] text-text-muted">
                  {eligibility?.eligible
                    ? 'Eligible for discharge (3/3 days afebrile)'
                    : `Needs 3 consecutive afebrile days (${eligibility?.length || 0}/3)`}
                </span>
              </div>
              <StreakDots
                streakLength={eligibility?.length || 0}
                days={eligibility?.days}
              />
            </div>
          </div>

          {/* Historical Temperature Mini Table */}
          <div className="bg-surface-pure rounded-card p-4 border border-line/60">
            <h3 className="text-xs font-semibold uppercase text-text-muted tracking-wider mb-2">
              Temperature History (Stay Records)
            </h3>
            <div className="divide-y divide-line/40 max-h-48 overflow-y-auto">
              {readings.length === 0 ? (
                <div className="text-center py-4 text-xs text-text-muted">No readings recorded.</div>
              ) : (
                readings.map((r) => (
                  <div key={r.id || r._id} className="py-2 flex items-center justify-between text-xs">
                    <span className="font-medium text-brand-ink tabular-nums">{r.date}</span>
                    <div className="flex items-center gap-2">
                      <StatusBadge
                        variant={r.isCritical ? 'critical' : r.isFever ? 'fever' : 'neutral'}
                        label={`${r.valueC} °C`}
                      />
                      <span className="text-[10px] text-text-muted">
                        {r.recordedByRole === 'DOCTOR' ? 'Dr. Override' : 'Nurse'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Visit Form & Clinical Decisions             */}
        {/* ========================================================= */}
        <div className="lg:col-span-6 space-y-4">
          {/* Primary Daily Visit Card */}
          <div className="bg-surface-pure rounded-card p-4 border border-line/60">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-brand-blue" />
                <h3 className="text-sm font-semibold text-brand-ink">
                  {todayVisit ? 'Today\'s Visit Logged' : 'Log Daily Primary Visit'}
                </h3>
              </div>
              {todayVisit && (
                <StatusBadge variant="success" label="Completed" icon={CheckCircle2} />
              )}
            </div>

            {!todayReading && (
              <div className="my-3 p-3 bg-red-50 text-fever text-xs rounded-xl border border-red-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Visit Blocked:</strong> Today's temperature is missing. Ask nursing to record it first (VIS-2).
                </span>
              </div>
            )}

            <form onSubmit={handleSaveVisit} className="mt-4 space-y-3">
              {/* Clinical Status Segmented Control */}
              <div>
                <label className="text-xs font-semibold text-brand-ink block mb-1.5">
                  Clinical Status (VIS-4)
                </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl text-xs font-medium">
                  {['STABLE', 'IMPROVING', 'WORSENING', 'CRITICAL'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      disabled={!!todayVisit || !todayReading}
                      onClick={() => setClinicalStatus(st)}
                      className={`py-1.5 rounded-lg transition-all capitalize text-[11px] ${
                        clinicalStatus === st
                          ? 'bg-white text-brand-ink font-semibold shadow-xs'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      {st.toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clinical Notes */}
              <div>
                <label className="text-xs font-semibold text-brand-ink block mb-1">
                  Clinical Examination & Symptoms *
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={!!todayVisit || !todayReading}
                  placeholder="Record lung sounds, hydration status, vitals, respiratory observation..."
                  rows={3}
                  className="w-full text-xs p-3 rounded-lg border border-line focus:outline-none focus:ring-1 focus:ring-brand-blue bg-slate-50/50 resize-none"
                  required
                />
              </div>

              {/* Treatment Plan */}
              <div>
                <label className="text-xs font-semibold text-brand-ink block mb-1">
                  Treatment / Care Plan (Optional)
                </label>
                <input
                  type="text"
                  value={treatmentPlan}
                  onChange={(e) => setTreatmentPlan(e.target.value)}
                  disabled={!!todayVisit || !todayReading}
                  placeholder="Maintain paracetamol PRN, electrolyte hydration..."
                  className="w-full text-xs px-3 py-2 rounded-lg border border-line focus:outline-none focus:ring-1 focus:ring-brand-blue bg-slate-50/50"
                />
              </div>

              {/* Save Button if no visit yet */}
              {!todayVisit && (
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={saveLoading}
                  disabled={!todayReading}
                  className="w-full mt-2"
                >
                  Save Daily Visit
                </Button>
              )}
            </form>

            {/* Existing Visit Addendum Section (VIS-3) */}
            {todayVisit && (
              <div className="mt-4 pt-4 border-t border-line space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-ink">
                  <FileText className="w-3.5 h-3.5 text-brand-blue" />
                  <span>Append Visit Addendum (Append-Only)</span>
                </div>

                {todayVisit.addenda && todayVisit.addenda.length > 0 && (
                  <div className="space-y-1.5 p-2.5 bg-slate-50 rounded-lg text-xs border border-line/60">
                    {todayVisit.addenda.map((ad, idx) => (
                      <div key={idx} className="text-[11px] text-text-secondary border-b border-line/30 pb-1 last:border-none">
                        <span className="font-semibold text-brand-ink">Dr. {ad.doctorName || 'Doctor'}: </span>
                        <span>{ad.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={addendumText}
                    onChange={(e) => setAddendumText(e.target.value)}
                    placeholder="Enter addendum note..."
                    className="flex-1 text-xs px-3 py-2 rounded-lg border border-line focus:outline-none focus:ring-1 focus:ring-brand-blue"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddAddendum}
                    isLoading={addendumLoading}
                    disabled={!addendumText.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Discharge Eligibility & Approval Decision Card (DIS-3) */}
          <div className="bg-surface-pure rounded-card p-4 border border-line/60">
            <h3 className="text-xs font-semibold uppercase text-text-muted tracking-wider mb-2">
              Discharge Pathway
            </h3>

            {isApproved ? (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-emerald-900 block">
                    Discharge Approved
                  </span>
                  <span className="text-[11px] text-emerald-700">
                    Patient is waiting in Admin queue for bed checkout.
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRevokeDialog(true)}
                  className="text-fever text-xs hover:bg-red-50"
                >
                  Revoke Approval
                </Button>
              </div>
            ) : eligibility?.eligible ? (
              <div className="p-3 bg-[#F5EAF4] rounded-xl border border-[#E3B9DF] space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#8E44AD]" />
                  <span className="text-xs font-semibold text-[#5B2C6F]">
                    Discharge Criterion Met (3/3 Days Afebrile)
                  </span>
                </div>
                <p className="text-[11px] text-slate-700">
                  Head doctor policy requires clinical approval before Admin can free the bed.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Sparkles}
                  onClick={() => setShowApproveModal(true)}
                  className="w-full bg-[#8E44AD] hover:bg-[#7D3C98] text-white"
                >
                  Approve Discharge
                </Button>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl border border-line text-xs text-text-muted">
                Discharge not yet possible. Patient has {eligibility?.length || 0} of 3 required consecutive fever-free days.
              </div>
            )}
          </div>

          {/* Danger Zone: Record Death (DEC-1, DEC-2) */}
          {!isClosed && (
            <div className="p-3 rounded-card border border-red-200 bg-red-50/40 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-red-900 block">Fatal Outcome</span>
                <span className="text-[10px] text-red-700">Irreversible action; frees bed and recomputes mortality.</span>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDeathModal(true)}
              >
                Record Death
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Discharge Approval Confirmation Evidence Modal (DIS-3) */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="Approve Patient Discharge"
        description="Verify consecutive fever-free evidence before confirming clinical approval."
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-line space-y-2">
            <span className="font-semibold text-brand-ink block">Verified Clinical Evidence:</span>
            <div className="space-y-1 text-[11px] text-text-secondary">
              <div>• Patient: <strong>{patient.name}</strong> (Room {patient.roomNumber})</div>
              <div>• Criterion: 3 consecutive facility dates with afebrile readings</div>
              <div>• Streak length: <strong>3 of 3 days afebrile</strong></div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowApproveModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleApproveDischarge}
              isLoading={approveLoading}
            >
              Confirm Discharge Approval
            </Button>
          </div>
        </div>
      </Modal>

      {/* Revoke Discharge Dialog */}
      <ReasonDialog
        isOpen={showRevokeDialog}
        onClose={() => setShowRevokeDialog(false)}
        onConfirm={handleRevokeDischarge}
        title="Revoke Discharge Approval"
        description={`Revoking discharge approval for ${patient.name}. The patient will return to ADMITTED status.`}
        placeholder="Enter reason for revocation (e.g. recurrence of symptoms, new fever spike)..."
        confirmLabel="Revoke Approval"
        confirmVariant="danger"
        isLoading={revokeLoading}
      />

      {/* Record Death Modal (DEC-1, DEC-2) */}
      <Modal
        isOpen={showDeathModal}
        onClose={() => setShowDeathModal(false)}
        title="Record Patient Death (DEC-1, DEC-2)"
        description="This action is irreversible. The room will be freed immediately and facility mortality recomputed."
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-red-900 space-y-1">
            <strong>Warning: Confirmation Checkpoint</strong>
            <p className="text-[11px]">
              To prevent accidental fatal records, type the patient's room number <strong>{patient.roomNumber}</strong> below to confirm.
            </p>
          </div>

          <div>
            <label className="font-semibold text-brand-ink block mb-1">
              Confirm Room Number *
            </label>
            <input
              type="text"
              placeholder={`Type "${patient.roomNumber}" to confirm`}
              value={deathRoomInput}
              onChange={(e) => setDeathRoomInput(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-line text-xs font-bold text-center"
            />
          </div>

          <div>
            <label className="font-semibold text-brand-ink block mb-1">
              Cause of Death Clinical Note *
            </label>
            <textarea
              placeholder="Record cause of death (e.g. cardiac arrest secondary to severe viral pneumonia)..."
              value={deathCauseNote}
              onChange={(e) => setDeathCauseNote(e.target.value)}
              rows={3}
              className="w-full p-2.5 rounded-lg border border-line text-xs resize-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
            <Button variant="ghost" size="sm" onClick={() => setShowDeathModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleRecordDeath}
              isLoading={deathLoading}
              disabled={Number(deathRoomInput) !== Number(patient.roomNumber) || !deathCauseNote.trim()}
            >
              Record Deceased Case
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
