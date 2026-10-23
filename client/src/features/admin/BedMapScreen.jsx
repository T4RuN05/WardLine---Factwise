import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAppData } from '../../state/AppDataContext.jsx';
import { useAuth } from '../../state/AuthContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { StreakDots } from '../../components/ui/StreakDots.jsx';
import {
  Layers,
  UserPlus,
  Thermometer,
  Stethoscope,
  X,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

export function BedMapScreen() {
  const { overview, refreshOverview } = useAppData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bedMapData, setBedMapData] = useState({ counts: {}, tiles: [] });
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [activeWardFilter, setActiveWardFilter] = useState('ALL');

  const role = user?.role || 'ADMIN';

  const loadBedMap = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/rooms');
      setBedMapData(res);
    } catch (err) {
      toast.error(err.message || 'Failed to load bed map.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBedMap();
  }, [loadBedMap]);

  const wards = [
    { id: 'A', name: 'Ward A', range: 'Rooms 1–19' },
    { id: 'B', name: 'Ward B', range: 'Rooms 20–37' },
    { id: 'C', name: 'Ward C', range: 'Rooms 38–56' },
    { id: 'D', name: 'Ward D', range: 'Rooms 57–74' },
  ];

  const filteredWards =
    activeWardFilter === 'ALL'
      ? wards
      : wards.filter((w) => w.id === activeWardFilter);

  const isFull = bedMapData.counts.free === 0;

  return (
    <div className="space-y-4">
      {/* Bed Map Header */}
      <div className="bg-surface-pure rounded-card p-4 border border-line/60 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-brand-ink">Facility Bed Map (74 Rooms)</h2>
            <span className="text-xs text-text-muted">· Live Capacity Management</span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Real-time room occupancy, afebrile streaks, fever classifications, and discharge approvals.
          </p>
        </div>

        {/* Action: Admit button with ADM-1 capacity guard */}
        <div className="flex items-center gap-2">
          <Button
            variant={isFull ? 'secondary' : 'primary'}
            size="sm"
            icon={UserPlus}
            disabled={isFull && (role === 'NURSE' || role === 'ADMIN')}
            onClick={() => navigate('/patients/new')}
            title={
              isFull
                ? 'All 74 rooms are occupied. Discharge or close a case to free a room (ADM-1).'
                : 'Admit a patient into an available room'
            }
          >
            {isFull ? 'Ward Full (74/74)' : 'Admit Patient'}
          </Button>
        </div>
      </div>

      {/* Header Chips & Legend */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs bg-surface-pure rounded-card p-3 border border-line/60">
        {/* Status Counts */}
        <div className="flex items-center gap-2 overflow-x-auto select-none">
          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-semibold tabular-nums">
            Occupied: {bedMapData.counts.occupied ?? 74}
          </span>
          <span
            className={`px-2.5 py-1 rounded-md font-semibold tabular-nums ${
              bedMapData.counts.free > 0
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            Free: {bedMapData.counts.free ?? 0}
          </span>
          <span className="px-2.5 py-1 rounded-md bg-[#F5EAF4] text-[#8E44AD] font-semibold tabular-nums">
            Eligible: {bedMapData.counts.eligible ?? 6}
          </span>
          <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-semibold tabular-nums">
            Approved: {bedMapData.counts.approved ?? 3}
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-text-muted flex-wrap">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded border-2 border-emerald-500 bg-white" />
            <span>Free</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-fever" />
            <span>Fever</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-brand-blue" />
            <span>Afebrile</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-[#8E44AD]" />
            <span>Eligible (3/3)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-emerald-600" />
            <span>Approved</span>
          </div>
        </div>
      </div>

      {/* Ward Filter Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs select-none">
        <button
          onClick={() => setActiveWardFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg transition-all font-medium ${
            activeWardFilter === 'ALL'
              ? 'bg-brand-ink text-white shadow-xs'
              : 'bg-white text-text-secondary hover:bg-slate-100 border border-line/60'
          }`}
        >
          All Wards (74)
        </button>
        {wards.map((w) => (
          <button
            key={w.id}
            onClick={() => setActiveWardFilter(w.id)}
            className={`px-3 py-1.5 rounded-lg transition-all font-medium ${
              activeWardFilter === w.id
                ? 'bg-brand-ink text-white shadow-xs'
                : 'bg-white text-text-secondary hover:bg-slate-100 border border-line/60'
            }`}
          >
            {w.name} ({w.range})
          </button>
        ))}
      </div>

      {/* 74 Interactive Bed Tiles grouped by ward */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-text-muted text-xs">Loading 74 rooms...</div>
        ) : (
          filteredWards.map((w) => {
            const wardTiles = (bedMapData.tiles || []).filter((t) => t.ward === w.id);

            return (
              <div key={w.id} className="bg-surface-pure rounded-card p-4 border border-line/60 shadow-2xs">
                <div className="flex items-center justify-between mb-3 border-b border-line/40 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold text-brand-blue bg-blue-50 px-2 py-0.5 rounded">
                      {w.name}
                    </span>
                    <span className="text-xs text-text-muted">{w.range}</span>
                  </div>
                  <span className="text-[11px] text-text-muted">
                    {wardTiles.filter((t) => t.status === 'AVAILABLE').length} free of {wardTiles.length}
                  </span>
                </div>

                {/* Ward Grid of Tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-10 gap-2">
                  {wardTiles.map((tile) => {
                    const isAvailable = tile.status === 'AVAILABLE';
                    const isFever = tile.todayReading?.isFever;
                    const isCritical = tile.todayReading?.isCritical;
                    const isEligible = tile.eligibility?.eligible;
                    const isApproved = tile.isApproved;
                    const isSelected = selectedRoom?.number === tile.number;

                    return (
                      <div
                        key={tile.number}
                        onClick={() => setSelectedRoom(tile)}
                        className={`p-2.5 rounded-xl border cursor-pointer select-none transition-all flex flex-col justify-between h-20 text-left relative ${
                          isSelected
                            ? 'ring-2 ring-brand-blue border-brand-blue shadow-md'
                            : 'hover:border-slate-400 hover:shadow-xs'
                        } ${
                          isAvailable
                            ? 'bg-emerald-50/50 border-emerald-300'
                            : isApproved
                            ? 'bg-emerald-50 border-emerald-400'
                            : isEligible
                            ? 'bg-[#F5EAF4] border-[#D7BDE2]'
                            : isCritical
                            ? 'bg-red-50 border-red-400'
                            : isFever
                            ? 'bg-orange-50 border-orange-300'
                            : 'bg-white border-line'
                        }`}
                      >
                        {/* Top: Room Number & Badge */}
                        <div className="flex items-center justify-between">
                          <span className="text-base font-bold text-brand-ink tabular-nums leading-none">
                            {tile.number}
                          </span>
                          {isAvailable ? (
                            <span className="text-[9px] uppercase font-bold text-emerald-700 bg-emerald-100 px-1 rounded">
                              Free
                            </span>
                          ) : isApproved ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : isEligible ? (
                            <Sparkles className="w-3.5 h-3.5 text-[#8E44AD]" />
                          ) : isCritical ? (
                            <span className="w-2 h-2 rounded-full bg-critical ring-2 ring-critical/30" />
                          ) : isFever ? (
                            <span className="w-2 h-2 rounded-full bg-fever" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-slate-300" />
                          )}
                        </div>

                        {/* Bottom: Patient or Free state */}
                        <div className="min-w-0">
                          {isAvailable ? (
                            <span className="text-[10px] text-emerald-700 font-medium">+ Free</span>
                          ) : (
                            <>
                              <div className="text-[11px] font-semibold text-brand-ink truncate leading-tight">
                                {tile.patient?.name?.split(' ')[0] || 'Patient'}
                              </div>
                              <div className="text-[9px] text-text-muted tabular-nums">
                                {tile.todayReading ? `${tile.todayReading.valueC} °C` : 'Pending'}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Selected Room Slide-Over Drawer */}
      {selectedRoom && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs" onClick={() => setSelectedRoom(null)} />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-white shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div>
                <span className="text-xs uppercase font-bold text-brand-blue bg-blue-50 px-2 py-0.5 rounded">
                  Ward {selectedRoom.ward}
                </span>
                <h3 className="text-lg font-bold text-brand-ink mt-1">
                  Room {selectedRoom.number}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRoom(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-brand-ink hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedRoom.status === 'AVAILABLE' ? (
              <div className="my-6 space-y-4">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                  <span className="text-xs font-semibold text-emerald-900 block mb-1">
                    Room is Available
                  </span>
                  <p className="text-[11px] text-emerald-700">
                    This bed is clean and ready for immediate patient admission.
                  </p>
                </div>

                <Button
                  variant="primary"
                  icon={UserPlus}
                  className="w-full"
                  onClick={() => navigate('/patients/new')}
                >
                  Admit Patient into Room {selectedRoom.number}
                </Button>
              </div>
            ) : (
              <div className="my-5 space-y-4 text-xs">
                {/* Patient Summary */}
                <div className="p-3 bg-slate-50 rounded-xl border border-line space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-brand-ink text-sm">
                      {selectedRoom.patient?.name}
                    </span>
                    <StatusBadge
                      variant={selectedRoom.isApproved ? 'approved' : 'neutral'}
                      label={selectedRoom.patient?.status || 'ADMITTED'}
                    />
                  </div>
                  <div className="text-text-muted">
                    {selectedRoom.patient?.age} {selectedRoom.patient?.sex} · MRN {selectedRoom.patient?.mrn}
                  </div>
                  <div className="text-text-secondary">
                    Admitted: {selectedRoom.patient?.admittedOn}
                  </div>
                </div>

                {/* Today's Reading */}
                <div className="p-3 bg-slate-50 rounded-xl border border-line flex items-center justify-between">
                  <span className="text-text-secondary">Today's Temperature:</span>
                  {selectedRoom.todayReading ? (
                    <StatusBadge
                      variant={selectedRoom.todayReading.isCritical ? 'critical' : selectedRoom.todayReading.isFever ? 'fever' : 'neutral'}
                      label={`${selectedRoom.todayReading.valueC} °C`}
                    />
                  ) : (
                    <span className="text-fever font-medium">Pending today</span>
                  )}
                </div>

                {/* Streak */}
                <div className="p-3 bg-slate-50 rounded-xl border border-line flex items-center justify-between">
                  <span className="text-text-secondary">Fever-Free Streak:</span>
                  <StreakDots
                    streakLength={selectedRoom.eligibility?.length || 0}
                    days={selectedRoom.eligibility?.days}
                  />
                </div>

                {/* Actions based on role */}
                <div className="space-y-2 pt-2 border-t border-line">
                  {role === 'NURSE' && !selectedRoom.todayReading && (
                    <Button
                      variant="primary"
                      icon={Thermometer}
                      className="w-full"
                      onClick={() => navigate('/nurse/worklist')}
                    >
                      Record Temperature
                    </Button>
                  )}

                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => navigate(`/patients/${selectedRoom.patient?.id}`)}
                  >
                    Open Patient Profile & Chart
                  </Button>

                  {role === 'DOCTOR' && (
                    <Button
                      variant="outline"
                      icon={Stethoscope}
                      className="w-full"
                      onClick={() => navigate(`/doctor/visit/${selectedRoom.patient?.id}`)}
                    >
                      Open Doctor Visit Page
                    </Button>
                  )}

                  {selectedRoom.isApproved && (role === 'ADMIN' || role === 'DIRECTOR') && (
                    <Button
                      variant="primary"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => navigate('/admin/discharges')}
                    >
                      Go to Discharge Checkout Queue
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
