import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAuth } from '../../state/AuthContext.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { MetricCard } from '../../components/ui/MetricCard.jsx';
import {
  Users,
  Search,
  UserPlus,
  ArrowRight,
  Filter,
  RefreshCw,
  Building2,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { formatDate } from '../../lib/format.js';

export function PatientsListScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [wardFilter, setWardFilter] = useState(searchParams.get('ward') || '');

  const canAdmit = user?.role === 'ADMIN' || user?.role === 'NURSE' || user?.role === 'DIRECTOR';

  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (wardFilter) params.ward = wardFilter;

      const res = await api.get('/api/patients', params);
      setPatients(res.data.patients || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch patients list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter, wardFilter]);

  const getStatusVariant = (status) => {
    switch (status) {
      case 'ADMITTED':
        return 'info';
      case 'DISCHARGE_APPROVED':
        return 'eligible';
      case 'DISCHARGED':
        return 'success';
      case 'DECEASED':
        return 'critical';
      default:
        return 'neutral';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'ADMITTED':
        return 'Inpatient';
      case 'DISCHARGE_APPROVED':
        return 'Discharge Approved';
      case 'DISCHARGED':
        return 'Discharged';
      case 'DECEASED':
        return 'Deceased';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-medium text-brand-ink">Patient Directory</h2>
          <p className="text-[11px] text-text-secondary mt-0.5">
            {total} total records registered in WardLine Quarantine Facility
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchPatients}
            disabled={loading}
            className="h-8 w-8 rounded-lg border border-line bg-white flex items-center justify-center text-text-muted hover:text-brand-ink transition-colors"
            title="Refresh directory"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          </button>

          {canAdmit && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/patients/new')}
              className="gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Admit Patient</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-card p-3 border border-line/60 flex flex-col md:flex-row items-center gap-3 justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by name, MRN, room, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-line/80 rounded-control focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Ward filter */}
          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="text-xs bg-white border border-line rounded-control px-2.5 py-1.5 text-text-secondary focus:outline-none focus:ring-1 focus:ring-brand-blue"
          >
            <option value="">All Wards (A - D)</option>
            <option value="A">Ward A (Rooms 1–18)</option>
            <option value="B">Ward B (Rooms 19–36)</option>
            <option value="C">Ward C (Rooms 37–55)</option>
            <option value="D">Ward D (Rooms 56–74)</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white border border-line rounded-control px-2.5 py-1.5 text-text-secondary focus:outline-none focus:ring-1 focus:ring-brand-blue"
          >
            <option value="">All Statuses</option>
            <option value="ADMITTED">Active Inpatients</option>
            <option value="DISCHARGE_APPROVED">Awaiting Checkout</option>
            <option value="DISCHARGED">Discharged</option>
            <option value="DECEASED">Deceased</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-card border border-line/60 overflow-hidden shadow-xs">
        {loading && patients.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-text-muted">
            <RefreshCw className="w-6 h-6 animate-spin text-brand-blue mb-2" />
            <p className="text-xs">Loading patient directory...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-fever flex flex-col items-center gap-1.5">
            <AlertCircle className="w-5 h-5 text-fever" />
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={fetchPatients} className="mt-2">
              Try Again
            </Button>
          </div>
        ) : patients.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-xs">
            No patients match the current search and filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-line/60 text-[10px] uppercase font-semibold text-text-muted bg-surface/50">
                  <th className="py-2.5 px-4">Patient</th>
                  <th className="py-2.5 px-3">MRN</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Admitted On</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40 text-xs">
                {patients.map((p) => {
                  const initials = p.name
                    ? p.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                    : 'PT';

                  const ward = p.roomId?.ward || (p.roomNumber ? `Ward ${p.roomNumber <= 18 ? 'A' : p.roomNumber <= 36 ? 'B' : p.roomNumber <= 55 ? 'C' : 'D'}` : '—');

                  return (
                    <tr
                      key={p._id || p.id}
                      onClick={() => navigate(`/patients/${p._id || p.id}`)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Patient Avatar & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-surface-soft-blue text-brand-blue font-semibold text-[11px] flex items-center justify-center border border-brand-blue/20 shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-medium text-brand-ink group-hover:text-brand-blue transition-colors">
                              {p.name}
                            </div>
                            <div className="text-[10px] text-text-muted">
                              {p.age} yrs · {p.sex}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* MRN */}
                      <td className="py-3 px-3 font-mono text-[11px] text-text-secondary">
                        {p.mrn}
                      </td>

                      {/* Room & Ward */}
                      <td className="py-3 px-3">
                        {p.roomNumber ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-brand-ink tabular-nums text-xs">
                              Room {String(p.roomNumber).padStart(2, '0')}
                            </span>
                            <span className="text-[10px] text-text-muted px-1.5 py-0.2 rounded bg-slate-100">
                              {ward}
                            </span>
                          </div>
                        ) : (
                          <span className="text-text-muted text-[11px] italic">Released</span>
                        )}
                      </td>

                      {/* Admitted Date */}
                      <td className="py-3 px-3 text-text-secondary text-[11px]">
                        {p.admittedOn || formatDate(p.admittedAt)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <StatusBadge
                          variant={getStatusVariant(p.status)}
                          label={getStatusLabel(p.status)}
                        />
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-blue group-hover:translate-x-0.5 transition-transform">
                          <span>View Profile</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
