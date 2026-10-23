import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAppData } from '../../state/AppDataContext.jsx';
import { useAuth } from '../../state/AuthContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { StreakDots } from '../../components/ui/StreakDots.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  LogOut,
} from 'lucide-react';
import { toast } from 'sonner';

export function DischargeQueueScreen() {
  const { overview, refreshOverview } = useAppData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [queue, setQueue] = useState({ counts: {}, awaitingApproval: [], readyForCheckout: [] });
  const [loading, setLoading] = useState(true);

  // Complete checkout modal state
  const [checkoutPatient, setCheckoutPatient] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const role = user?.role || 'ADMIN';

  const loadQueue = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/discharges');
      setQueue(res);
    } catch (err) {
      toast.error(err.message || 'Failed to load discharge queue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // Complete discharge checkout (DIS-4)
  const handleCompleteCheckout = async () => {
    if (!checkoutPatient) return;
    setCheckoutLoading(true);
    try {
      await api.post(`/patients/${checkoutPatient.id || checkoutPatient.patientId}/discharge/complete`);
      toast.success(
        `Discharged ${checkoutPatient.name}. Room ${checkoutPatient.roomNumber} is now free (ADM-7).`
      );
      setCheckoutPatient(null);
      await loadQueue();
      await refreshOverview();
    } catch (err) {
      toast.error(err.message || 'Discharge checkout failed.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-surface-pure rounded-card p-4 border border-line/60 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-brand-blue" />
            <h2 className="text-base font-semibold text-brand-ink">Discharge Logistics & Checkout Queue</h2>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Automatic eligibility calculation removes verbal handoff delays. Completed discharges free room capacity atomically.
          </p>
        </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="text-text-muted">
            Awaiting Approval:{' '}
            <strong className="text-brand-ink">{queue.counts?.awaitingApproval ?? 0}</strong>
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-text-muted">
            Ready for Checkout:{' '}
            <strong className="text-emerald-700">{queue.counts?.readyForCheckout ?? 0}</strong>
          </span>
        </div>
      </div>

      {/* SECTION 1: Ready for Checkout (Doctor Approved) */}
      <div className="bg-surface-pure rounded-card p-4 border border-line/60 space-y-3">
        <div className="flex items-center justify-between border-b border-line/40 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h3 className="text-sm font-semibold text-brand-ink">
              Ready for Admin Checkout ({queue.readyForCheckout?.length || 0})
            </h3>
          </div>
          <span className="text-[11px] text-text-muted">
            Doctor approved · Completing frees bed capacity
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-text-muted text-xs">Loading queue...</div>
        ) : queue.readyForCheckout?.length === 0 ? (
          <div className="p-8 text-center text-text-muted text-xs">
            No approved patients waiting for checkout.
          </div>
        ) : (
          <div className="divide-y divide-line/40">
            {queue.readyForCheckout.map((item) => (
              <div
                key={item.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[9px] uppercase font-bold text-emerald-700">Room</span>
                    <span className="text-base font-bold text-emerald-900 leading-tight tabular-nums">
                      {item.roomNumber}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-brand-ink">{item.name}</span>
                      <span className="text-[10px] text-text-muted bg-slate-100 px-1.5 py-0.5 rounded">
                        {item.age} {item.sex} · MRN {item.mrn} · Ward {item.ward}
                      </span>
                      {item.isOverdue && (
                        <span className="text-[10px] text-fever font-bold bg-red-50 border border-red-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Overdue ({item.waitingHours}h &gt; {item.slaHours}h SLA)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-text-secondary mt-0.5">
                      Approved by: <strong>{item.approvedByName}</strong> · Waiting time:{' '}
                      <span className="tabular-nums font-medium">{item.waitingHours} hours</span>
                    </div>
                  </div>
                </div>

                <div>
                  {role === 'ADMIN' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={LogOut}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => setCheckoutPatient(item)}
                    >
                      Complete Checkout
                    </Button>
                  ) : (
                    <span className="text-xs text-text-muted italic">
                      Waiting for Admin checkout
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Awaiting Doctor Approval (Eligible by 3-Day Rule) */}
      <div className="bg-surface-pure rounded-card p-4 border border-line/60 space-y-3">
        <div className="flex items-center justify-between border-b border-line/40 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8E44AD]" />
            <h3 className="text-sm font-semibold text-brand-ink">
              Awaiting Doctor Clinical Approval ({queue.awaitingApproval?.length || 0})
            </h3>
          </div>
          <span className="text-[11px] text-text-muted">
            3/3 consecutive afebrile days met automatically (DIS-1, DIS-2)
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-text-muted text-xs">Loading queue...</div>
        ) : queue.awaitingApproval?.length === 0 ? (
          <div className="p-8 text-center text-text-muted text-xs">
            No patients currently awaiting doctor approval.
          </div>
        ) : (
          <div className="divide-y divide-line/40">
            {queue.awaitingApproval.map((item) => (
              <div
                key={item.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#F5EAF4] border border-[#D7BDE2] flex flex-col items-center justify-center shrink-0">
                    <span className="text-[9px] uppercase font-bold text-[#8E44AD]">Room</span>
                    <span className="text-base font-bold text-[#5B2C6F] leading-tight tabular-nums">
                      {item.roomNumber}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-brand-ink">{item.name}</span>
                      <span className="text-[10px] text-text-muted bg-slate-100 px-1.5 py-0.5 rounded">
                        {item.age} {item.sex} · MRN {item.mrn} · Ward {item.ward}
                      </span>
                      {item.isOverdue && (
                        <span className="text-[10px] text-fever font-bold bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                          Overdue Approval
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-text-secondary mt-0.5 flex items-center gap-3">
                      <span>
                        Eligible since: <strong>{item.eligibleOn}</strong>
                      </span>
                      <span>·</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-text-muted">Streak:</span>
                        <StreakDots streakLength={item.streakLength} days={item.days} />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  {role === 'DOCTOR' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Sparkles}
                      className="bg-[#8E44AD] hover:bg-[#7D3C98] text-white"
                      onClick={() => navigate(`/doctor/visit/${item.id}`)}
                    >
                      Review & Approve
                    </Button>
                  ) : (
                    <span className="text-xs text-text-muted italic">
                      Awaiting Doctor Approval
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Complete Checkout Confirmation Dialog (DIS-4) */}
      <Modal
        isOpen={!!checkoutPatient}
        onClose={() => setCheckoutPatient(null)}
        title="Complete Patient Discharge Checkout (DIS-4)"
        description="Verify administrative discharge details."
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-1">
            <strong>Discharge Confirmation:</strong>
            <p className="text-[11px]">
              Discharge <strong>{checkoutPatient?.name}</strong> from Room <strong>{checkoutPatient?.roomNumber}</strong>?
              The room will be marked <strong>AVAILABLE</strong> immediately and occupancy counters decremented.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
            <Button variant="ghost" size="sm" onClick={() => setCheckoutPatient(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleCompleteCheckout}
              isLoading={checkoutLoading}
            >
              Confirm Discharge & Free Room
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
