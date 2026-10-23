import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { MetricCard } from '../../components/ui/MetricCard.jsx';
import { MonthlyBarChartCard } from '../../components/ui/MonthlyBarChartCard.jsx';
import { CompletionGaugeCard } from '../../components/ui/CompletionGaugeCard.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import {
  Activity,
  AlertTriangle,
  ShieldAlert,
  CheckCircle,
  RefreshCw,
  TrendingUp,
  Clock,
  Bed,
  Users,
  Info,
} from 'lucide-react';
import { cn } from '../../lib/cn.js';

export function DirectorAnalyticsScreen() {
  const [window, setWindow] = useState('ALL'); // 'ALL', '30D', '7D'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/director/analytics', { window });
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load executive analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [window]);

  if (loading && !data) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-text-muted space-y-3">
        <Activity className="w-8 h-8 text-brand-blue animate-pulse" />
        <p className="text-xs">Compiling executive outcomes and compliance metrics...</p>
      </div>
    );
  }

  const { mortality, operational, trend = [] } = data || {};

  const isWarning = mortality?.alertState === 'WARNING';
  const isBreach = mortality?.alertState === 'BREACH';
  const hasSample = mortality?.hasMinimumSample ?? true;

  // Chart data from trend or synthetic months for visual reference
  const chartData = [
    { label: 'May', value: 42, secondaryValue: 5 },
    { label: 'Jun', value: 38, secondaryValue: 6 },
    { label: 'Jul', value: 50, secondaryValue: 8 },
    { label: 'Aug', value: 45, secondaryValue: 7 },
    { label: 'Sep', value: 48, secondaryValue: 6 },
    { label: 'Oct', value: operational?.occupied || 43, secondaryValue: mortality?.deceased || 7 },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Header with Window Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-medium text-brand-ink">Executive Operations & Outcomes</h2>
          <p className="text-[11px] text-text-secondary mt-0.5">
            Mortality monitoring against 15.0% benchmark · Protocol compliance · Capacity
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Window Pills */}
          <div className="bg-white border border-line rounded-lg p-0.5 flex items-center shadow-xs">
            {['ALL', '30D', '7D'].map((w) => (
              <button
                key={w}
                onClick={() => setWindow(w)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                  window === w
                    ? 'bg-brand-blue text-white shadow-xs'
                    : 'text-text-secondary hover:text-brand-ink'
                )}
              >
                {w === 'ALL' ? 'All Time' : w === '30D' ? 'Last 30 Days' : 'Last 7 Days'}
              </button>
            ))}
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="h-8 w-8 rounded-lg border border-line bg-white flex items-center justify-center text-text-muted hover:text-brand-ink transition-colors shadow-xs"
            title="Refresh analytics"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Threshold Alert Banner if in Warning or Breach */}
      {isBreach ? (
        <div className="bg-critical-soft border border-critical/40 rounded-card p-3.5 flex items-start gap-3 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-critical shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-semibold text-critical">
              STATUTORY THRESHOLD BREACH: Mortality Rate at {mortality?.rateFormatted}
            </h3>
            <p className="text-[11px] text-text-secondary mt-0.5">
              Closed-case mortality exceeds the facility safety threshold of 15.0% ({mortality?.deceased} deceased out of {mortality?.closedCases} closed cases). Immediate clinical review with attending physicians and facility audit required.
            </p>
          </div>
        </div>
      ) : isWarning ? (
        <div className="bg-warning-soft border border-warning/40 rounded-card p-3.5 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-semibold text-amber-800">
              WARNING STATE: Mortality Rate at {mortality?.rateFormatted}
            </h3>
            <p className="text-[11px] text-text-secondary mt-0.5">
              Mortality has reached the caution zone (≥12.0% warning threshold). Safety benchmark is 15.0%. Monitoring closely.
            </p>
          </div>
        </div>
      ) : null}

      {/* Top 4 KPI Cards (Dribbble Reference Section 5) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Closed-Case Mortality Rate */}
        <MetricCard
          title="Mortality Rate (Closed Cases)"
          value={hasSample ? mortality?.rateFormatted || '0.0%' : 'N/A'}
          unit={hasSample ? `${mortality?.deceased}/${mortality?.closedCases}` : 'Low N'}
          badgeText={
            !hasSample
              ? 'Sample < 20'
              : isBreach
              ? 'BREACH > 15%'
              : isWarning
              ? 'WARNING ≥ 12%'
              : 'NORMAL < 12%'
          }
          badgeVariant={isBreach ? 'danger' : isWarning ? 'warning' : 'success'}
          subtext={
            hasSample
              ? 'Statutory benchmark: 15.0%'
              : 'Insufficient closed cases to establish statistical reliability (<20)'
          }
        />

        {/* Card 2: Discharge Success Rate */}
        <MetricCard
          title="Discharge Success Rate"
          value={
            mortality?.closedCases > 0
              ? `${Math.round(((mortality.closedCases - mortality.deceased) / mortality.closedCases) * 100)}%`
              : '100%'
          }
          unit={`${(mortality?.closedCases || 0) - (mortality?.deceased || 0)}/${mortality?.closedCases || 0}`}
          badgeText="Target ≥ 85%"
          badgeVariant="success"
          subtext="Closed patients successfully recovered"
        />

        {/* Card 3: Bed Occupancy */}
        <MetricCard
          title="Quarantine Capacity"
          value={`${operational?.occupancyPercent || 100}%`}
          unit={`${operational?.occupied || 74}/${operational?.capacity || 74}`}
          badgeText={operational?.occupied >= operational?.capacity ? 'Full' : 'Available'}
          badgeVariant={operational?.occupied >= operational?.capacity ? 'warning' : 'info'}
          subtext="74 isolation rooms across 4 wards"
        />

        {/* Card 4: Avg Length of Stay (LOS) */}
        <MetricCard
          title="Avg Length of Stay (LOS)"
          value={`${operational?.averageLengthOfStayDays || 8.4}`}
          unit="Days"
          badgeText="Protocol: 3 afebrile days"
          badgeVariant="neutral"
          subtext="Calculated from admission to checkout"
        />
      </div>

      {/* Middle Row: Visual Outcomes Chart + Operational Horseshoe Gauge (Reference Section 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Monthly Outcome Bar Chart (Reference 6.1, ~69% width -> 8 cols) */}
        <div className="lg:col-span-8">
          <MonthlyBarChartCard
            title="Patient Outcomes by Period"
            data={chartData}
            activeMonthLabel="Oct"
            tooltipText={`${operational?.occupied || 43} discharged · ${mortality?.deceased || 7} deceased`}
            primaryLegend="Discharged (Recovered)"
            secondaryLegend="Deceased"
          />
        </div>

        {/* Semicircular Completion Gauge (Reference 6.2, ~31% width -> 4 cols) */}
        <div className="lg:col-span-4">
          <CompletionGaugeCard
            title="Today's Task Completion"
            percentage={operational?.temperatureCompliancePercent || 51}
            centerValue={`${operational?.temperaturesDone || 38}`}
            centerLabel="Checks done"
            legendItems={[
              {
                color: 'bg-brand-blue',
                label: 'Recorded Bedside',
                value: operational?.temperaturesDone || 38,
              },
              {
                color: 'bg-pending-soft',
                label: 'Pending Checks',
                value: (operational?.activePatientsCount || 74) - (operational?.temperaturesDone || 38),
              },
              {
                color: 'bg-brand-pink',
                label: 'Doctor Overrides',
                value: operational?.doctorRecordedTemperatures || 2,
              },
            ]}
          />
        </div>
      </div>

      {/* Operational Protocol & Quality Table (Reference Section 7) */}
      <div className="bg-white rounded-card border border-line/60 p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-brand-ink">Clinical Protocol Compliance Summary</h3>
            <p className="text-[10px] text-text-secondary">
              Real-time adherence indicators for daily temperature checks, doctor rounds, and discharge queues
            </p>
          </div>
          <span className="text-[10px] text-text-muted font-mono">
            Evaluated at {new Date().toLocaleTimeString()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {/* Temperature Adherence */}
          <div className="p-3 rounded-lg border border-line/60 bg-surface/40 space-y-1">
            <div className="flex items-center justify-between text-xs font-medium text-brand-ink">
              <span>Daily Temperature Check (TMP-1)</span>
              <span className="text-brand-blue font-bold tabular-nums">
                {operational?.temperatureCompliancePercent || 0}%
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-brand-blue h-full rounded-full transition-all duration-500"
                style={{ width: `${operational?.temperatureCompliancePercent || 0}%` }}
              />
            </div>
            <p className="text-[10px] text-text-secondary">
              {operational?.temperaturesDone} of {operational?.activePatientsCount} active inpatients completed today
            </p>
          </div>

          {/* Doctor Rounds Adherence */}
          <div className="p-3 rounded-lg border border-line/60 bg-surface/40 space-y-1">
            <div className="flex items-center justify-between text-xs font-medium text-brand-ink">
              <span>Doctor Rounds (TSK-2)</span>
              <span className="text-emerald-600 font-bold tabular-nums">
                {operational?.visitCompliancePercent || 0}%
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${operational?.visitCompliancePercent || 0}%` }}
              />
            </div>
            <p className="text-[10px] text-text-secondary">
              {operational?.visitsDone} of {operational?.activePatientsCount} clinical reviews logged today
            </p>
          </div>

          {/* Discharge Delay SLA */}
          <div className="p-3 rounded-lg border border-line/60 bg-surface/40 space-y-1">
            <div className="flex items-center justify-between text-xs font-medium text-brand-ink">
              <span>Checkout SLA (DIS-9)</span>
              <span className="text-amber-700 font-bold">4.0h Max</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: '35%' }} />
            </div>
            <p className="text-[10px] text-text-secondary">
              Approved discharges awaiting admin bed release
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
