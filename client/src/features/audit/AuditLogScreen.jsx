import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { Button } from '../../components/ui/Button.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User,
  Activity,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { formatDateTime } from '../../lib/format.js';

export function AuditLogScreen() {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [roleFilter, setRoleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchAuditEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit };
      if (roleFilter) params.role = roleFilter;
      if (actionFilter) params.action = actionFilter;
      if (search) params.search = search;

      const res = await api.get('/api/audit', params);
      setEvents(res.data.events || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch audit records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAuditEvents();
    }, 250);
    return () => clearTimeout(timer);
  }, [page, roleFilter, actionFilter, search]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const getActionBadgeColor = (action) => {
    if (action.includes('DEATH')) return 'bg-critical-soft text-critical border-critical/30';
    if (action.includes('REVOKE')) return 'bg-fever-soft text-fever border-fever/30';
    if (action.includes('DISCHARGE') || action.includes('APPROVE')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (action.includes('TEMPERATURE')) return 'bg-blue-50 text-brand-blue border-brand-blue/30';
    if (action.includes('VISIT')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (action.includes('ADMIT')) return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[17px] font-medium text-brand-ink">Facility Audit Trail</h2>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              Immutable Log
            </span>
          </div>
          <p className="text-[11px] text-text-secondary mt-0.5">
            Append-only clinical and administrative log for regulatory compliance and dispute traceability
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAuditEvents}
            disabled={loading}
            className="h-8 w-8 rounded-lg border border-line bg-white flex items-center justify-center text-text-muted hover:text-brand-ink transition-colors shadow-xs"
            title="Refresh log"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-card p-3 border border-line/60 flex flex-col md:flex-row items-center gap-3 justify-between shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by actor, patient, or summary..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-line/80 rounded-control focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-white border border-line rounded-control px-2.5 py-1.5 text-text-secondary focus:outline-none focus:ring-1 focus:ring-brand-blue"
          >
            <option value="">All Roles</option>
            <option value="NURSE">Nurse</option>
            <option value="DOCTOR">Doctor</option>
            <option value="ADMIN">Admin</option>
            <option value="DIRECTOR">Director</option>
          </select>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-white border border-line rounded-control px-2.5 py-1.5 text-text-secondary focus:outline-none focus:ring-1 focus:ring-brand-blue"
          >
            <option value="">All Actions</option>
            <option value="ADMIT_PATIENT">Admit Patient</option>
            <option value="RECORD_TEMPERATURE">Record Temperature</option>
            <option value="DOCTOR_OVERRIDE_TEMPERATURE">Doctor Temp Override</option>
            <option value="DOCTOR_VISIT">Doctor Visit</option>
            <option value="APPROVE_DISCHARGE">Approve Discharge</option>
            <option value="REVOKE_DISCHARGE">Revoke Discharge</option>
            <option value="COMPLETE_DISCHARGE">Complete Discharge</option>
            <option value="RECORD_DEATH">Record Death</option>
            <option value="SETTINGS_UPDATED">Settings Updated</option>
          </select>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-card border border-line/60 overflow-hidden shadow-xs">
        {loading && events.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-text-muted">
            <RefreshCw className="w-6 h-6 animate-spin text-brand-blue mb-2" />
            <p className="text-xs">Loading audit trail...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-fever flex flex-col items-center gap-1.5">
            <AlertCircle className="w-5 h-5 text-fever" />
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={fetchAuditEvents} className="mt-2">
              Try Again
            </Button>
          </div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-xs">
            No audit records match the current filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-line/60 text-[10px] uppercase font-semibold text-text-muted bg-surface/50">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">Patient / Target</th>
                  <th className="py-2.5 px-4">Audit Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {events.map((evt) => (
                  <tr key={evt._id || evt.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Timestamp */}
                    <td className="py-2.5 px-4 text-text-secondary text-[11px] font-mono whitespace-nowrap">
                      {formatDateTime(evt.at)}
                    </td>

                    {/* Action Pill */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={cn(
                          'text-[10px] font-semibold px-2 py-0.5 rounded border inline-block',
                          getActionBadgeColor(evt.action)
                        )}
                      >
                        {evt.action}
                      </span>
                    </td>

                    {/* Actor */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-medium text-brand-ink">{evt.actorName || 'Staff'}</div>
                      <div className="text-[9px] uppercase text-text-muted font-bold">
                        {evt.actorRole}
                      </div>
                    </td>

                    {/* Target / Patient */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-text-secondary">
                      {evt.patientName ? (
                        <div>
                          <span className="font-medium text-brand-ink">{evt.patientName}</span>
                          {evt.meta?.roomNumber && (
                            <span className="text-[10px] text-text-muted ml-1.5">
                              (Room {evt.meta.roomNumber})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-text-muted italic text-[11px]">Facility-wide</span>
                      )}
                    </td>

                    {/* Summary */}
                    <td className="py-2.5 px-4 text-text-primary text-[11px] leading-relaxed">
                      {evt.summary}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-3 border-t border-line/60 bg-surface/30 flex items-center justify-between text-xs text-text-secondary">
          <span>
            Showing {Math.min(total, (page - 1) * limit + 1)} - {Math.min(total, page * limit)} of {total} records
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-1 rounded border border-line bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-xs">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-1 rounded border border-line bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
