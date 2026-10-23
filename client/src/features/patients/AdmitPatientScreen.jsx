import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAuth } from '../../state/AuthContext.jsx';
import { useAppData } from '../../state/AppDataContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { toast } from 'sonner';
import {
  UserPlus,
  ArrowLeft,
  Building2,
  AlertTriangle,
  ShieldAlert,
  Thermometer,
  Phone,
  User,
  Heart,
} from 'lucide-react';
import { cn } from '../../lib/cn.js';

export function AdmitPatientScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refetchOverview } = useAppData();

  const [freeRooms, setFreeRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('Male');
  const [phone, setPhone] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('Next of Kin');

  // Optional initial reading
  const [recordInitialTemp, setRecordInitialTemp] = useState(false);
  const [initialTemp, setInitialTemp] = useState('37.0');
  const [route, setRoute] = useState('ORAL');

  // Load free rooms
  useEffect(() => {
    async function loadRooms() {
      setLoadingRooms(true);
      try {
        const res = await api.get('/api/rooms', { status: 'FREE' });
        const rooms = res.data.rooms || [];
        setFreeRooms(rooms);
        if (rooms.length > 0) {
          setRoomNumber(String(rooms[0].number));
        }
      } catch (err) {
        setError('Failed to load free rooms');
      } finally {
        setLoadingRooms(false);
      }
    }
    loadRooms();
  }, []);

  const isAtCapacity = !loadingRooms && freeRooms.length === 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Patient name is required');
      return;
    }
    if (!age || Number(age) <= 0 || Number(age) > 120) {
      setError('Valid age between 1 and 120 is required');
      return;
    }
    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }
    if (!roomNumber) {
      setError('Room selection is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        age: Number(age),
        sex,
        phone: phone.trim(),
        roomNumber: Number(roomNumber),
        emergencyContact: {
          name: emergencyContactName.trim() || 'Not provided',
          phone: emergencyContactPhone.trim() || phone.trim(),
          relationship: emergencyRelationship,
        },
      };

      if (recordInitialTemp && initialTemp) {
        payload.initialTemperature = {
          valueC: Number(initialTemp),
          route,
        };
      }

      const res = await api.post('/api/patients', payload);
      toast.success(`Patient ${name} admitted successfully to Room ${roomNumber}!`);
      await refetchOverview();
      const patientId = res.data.patient?._id || res.data.patient?.id;
      if (patientId) {
        navigate(`/patients/${patientId}`);
      } else {
        navigate('/patients');
      }
    } catch (err) {
      setError(err.message || 'Failed to admit patient');
      toast.error(err.message || 'Admission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-in fade-in duration-200">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-lg border border-line bg-white flex items-center justify-center text-text-muted hover:text-brand-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-[17px] font-medium text-brand-ink">Admit New Patient</h2>
            <p className="text-[11px] text-text-secondary">
              Direct quarantine admission with bed assignment & intake records
            </p>
          </div>
        </div>
      </div>

      {/* ADM-1 Capacity Warning if 0 free rooms */}
      {isAtCapacity && (
        <div className="bg-fever-soft border border-fever/30 rounded-card p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-fever shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-semibold text-fever">Facility at 100% Capacity (ADM-1)</h3>
            <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">
              All 74 quarantine rooms are currently occupied. Per facility admission rules, new patients cannot be admitted until an active patient is discharged or deceased.
            </p>
          </div>
        </div>
      )}

      {/* Main Admission Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-card border border-line/60 p-5 space-y-6 shadow-xs">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Section 1: Demographics */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-brand-blue" />
            <span>Patient Demographics</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-text-secondary mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Meera Raman"
                className="w-full text-xs bg-slate-50 border border-line rounded-control px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-text-secondary mb-1">
                  Age (Years) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  required
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="35"
                  className="w-full text-xs bg-slate-50 border border-line rounded-control px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-text-secondary mb-1">
                  Sex *
                </label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-line rounded-control px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-text-secondary mb-1">
                Contact Phone *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full text-xs bg-slate-50 border border-line rounded-control px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
            </div>

            {/* Room Assignment */}
            <div>
              <label className="block text-[11px] font-medium text-text-secondary mb-1">
                Assigned Quarantine Room *
              </label>
              <select
                disabled={isAtCapacity || loadingRooms}
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-line rounded-control px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
              >
                {loadingRooms ? (
                  <option>Loading free rooms...</option>
                ) : isAtCapacity ? (
                  <option>No free rooms available</option>
                ) : (
                  freeRooms.map((r) => (
                    <option key={r.number} value={r.number}>
                      Room {String(r.number).padStart(2, '0')} (Ward {r.ward})
                    </option>
                  ))
                )}
              </select>
              <span className="text-[10px] text-text-muted mt-1 block">
                {freeRooms.length} of 74 quarantine rooms currently free
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Emergency Contact (ADM-6) */}
        <div className="pt-3 border-t border-line/60">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-brand-pink" />
            <span>Emergency Contact Details (ADM-6)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-text-secondary mb-1">
                Contact Name
              </label>
              <input
                type="text"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                placeholder="Next of kin"
                className="w-full text-xs bg-slate-50 border border-line rounded-control px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-text-secondary mb-1">
                Emergency Phone
              </label>
              <input
                type="tel"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                placeholder="+91..."
                className="w-full text-xs bg-slate-50 border border-line rounded-control px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-text-secondary mb-1">
                Relationship
              </label>
              <input
                type="text"
                value={emergencyRelationship}
                onChange={(e) => setEmergencyRelationship(e.target.value)}
                placeholder="Spouse / Parent / Sibling"
                className="w-full text-xs bg-slate-50 border border-line rounded-control px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Optional Initial Reading (ADM-5) */}
        <div className="pt-3 border-t border-line/60">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-amber-600" />
              <span>Initial Bedside Temperature (Optional)</span>
            </h3>
            <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={recordInitialTemp}
                onChange={(e) => setRecordInitialTemp(e.target.checked)}
                className="rounded border-line text-brand-blue focus:ring-brand-blue"
              />
              <span>Record intake reading now</span>
            </label>
          </div>

          {recordInitialTemp && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-surface rounded-control border border-line/60">
              <div>
                <label className="block text-[11px] font-medium text-text-secondary mb-1">
                  Intake Temperature (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="32"
                  max="43"
                  value={initialTemp}
                  onChange={(e) => setInitialTemp(e.target.value)}
                  className="w-full text-xs bg-white border border-line rounded-control px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                />
                <span className="text-[10px] text-text-muted mt-1 block">
                  Hard bounds 32.0 – 43.0 °C. ≥38.0 °C flags fever.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-text-secondary mb-1">
                  Measurement Route
                </label>
                <select
                  value={route}
                  onChange={(e) => setRoute(e.target.value)}
                  className="w-full text-xs bg-white border border-line rounded-control px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                >
                  <option value="ORAL">Oral</option>
                  <option value="TYMPANIC">Tympanic (Ear)</option>
                  <option value="AXILLARY">Axillary (Armpit)</option>
                  <option value="TEMPORAL">Temporal (Forehead)</option>
                  <option value="RECTAL">Rectal</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-line/60 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => navigate(-1)}
            disabled={submitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isAtCapacity || submitting}
            className="gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>{submitting ? 'Admitting...' : 'Complete Admission'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
