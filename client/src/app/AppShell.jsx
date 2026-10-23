import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';
import { useAppData } from '../state/AppDataContext.jsx';
import {
  Activity,
  Calendar,
  ClipboardList,
  Grid,
  HeartPulse,
  LogOut,
  Settings,
  ShieldCheck,
  Stethoscope,
  Thermometer,
  Users,
  Search,
  Bell,
  Sparkles,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { cn } from '../lib/cn.js';
import { MiniCalendar } from '../components/ui/MiniCalendar.jsx';
import { DailySummaryCard } from '../components/ui/DailySummaryCard.jsx';
import { SidebarPatientList } from '../components/ui/SidebarPatientList.jsx';
import { AlertBanner } from '../components/ui/AlertBanner.jsx';
import { DemoDrawer } from '../components/ui/DemoDrawer.jsx';

export function AppShell() {
  const { user, personas, loginAsDemoUser, logout } = useAuth();
  const { overview } = useAppData();
  const navigate = useNavigate();
  const location = useLocation();

  const [isDemoDrawerOpen, setIsDemoDrawerOpen] = useState(false);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  const role = user?.role || 'NURSE';

  // Navigation Items with role highlighting
  const navItems = [
    { to: '/', label: 'Overview', icon: Grid, roles: ['NURSE', 'DOCTOR', 'ADMIN', 'DIRECTOR'] },
    { to: '/nurse/worklist', label: 'Nurse Worklist', icon: Thermometer, roles: ['NURSE', 'DIRECTOR'] },
    { to: '/doctor/rounds', label: 'Doctor Rounds', icon: Stethoscope, roles: ['DOCTOR', 'DIRECTOR'] },
    { to: '/admin/beds', label: 'Bed Map (74 Rooms)', icon: Layers, roles: ['NURSE', 'DOCTOR', 'ADMIN', 'DIRECTOR'] },
    { to: '/admin/discharges', label: 'Discharge Queue', icon: ClipboardList, roles: ['DOCTOR', 'ADMIN', 'DIRECTOR'] },
    { to: '/patients', label: 'Patient Directory', icon: Users, roles: ['NURSE', 'DOCTOR', 'ADMIN', 'DIRECTOR'] },
    { to: '/director/analytics', label: 'Director Analytics', icon: Activity, roles: ['DIRECTOR'] },
  ];

  const visibleNav = navItems.filter((item) => item.roles.includes(role));

  const handlePersonaSwitch = async (pUser) => {
    setShowPersonaMenu(false);
    await loginAsDemoUser(pUser.id || pUser._id);
  };

  return (
    <div className="min-h-screen bg-canvas p-2 md:p-4 lg:p-6 flex items-center justify-center font-sans antialiased text-text-primary">
      {/* Outer Application Frame matching Reference x=64/y=65 radius-app */}
      <div className="w-full max-w-[1440px] min-h-[850px] bg-surface rounded-app shadow-sm border border-line/50 flex overflow-hidden">
        {/* ========================================================= */}
        {/* LEFT TWO-PART SIDEBAR (Reference Section 4.1 & 4.2)      */}
        {/* ========================================================= */}
        <aside className="hidden lg:flex bg-sidebar text-white w-[300px] xl:w-[320px] shrink-0 m-2.5 rounded-sidebar flex-col justify-between overflow-hidden shadow-md">
          <div className="flex h-full">
            {/* 1. Icon Rail (Reference Section 4.2) */}
            <div className="w-[58px] bg-sidebar border-r border-white/5 py-4 flex flex-col items-center justify-between shrink-0">
              <div className="flex flex-col items-center gap-3">
                {/* Brand Logo Mark */}
                <div
                  onClick={() => navigate('/')}
                  className="w-8 h-8 rounded-xl bg-brand-blue/20 text-brand-blue flex items-center justify-center cursor-pointer hover:bg-brand-blue/30 transition-colors"
                  title="WardLine Quarantine Centre"
                >
                  <HeartPulse className="w-5 h-5 text-brand-blue" />
                </div>

                {/* Primary Navigation Icons */}
                <div className="flex flex-col items-center gap-1.5 mt-2">
                  {visibleNav.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.to;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        title={item.label}
                        className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                          isActive
                            ? 'bg-brand-blue text-white shadow-xs'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </NavLink>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Utilities */}
              <div className="flex flex-col items-center gap-2">
                <NavLink
                  to="/audit"
                  title="Audit Trail"
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                    location.pathname === '/audit'
                      ? 'bg-brand-blue text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <ShieldCheck className="w-4 h-4" />
                </NavLink>

                <NavLink
                  to="/director/settings"
                  title="Facility Settings"
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                    location.pathname === '/director/settings'
                      ? 'bg-brand-blue text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Settings className="w-4 h-4" />
                </NavLink>

                <button
                  onClick={logout}
                  title="Sign Out"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-fever hover:bg-white/5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. Sidebar Context Column (Calendar + Daily Capsule + Patient List) */}
            <div className="flex-1 p-3.5 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-3">
                {/* Mini Calendar Card */}
                <MiniCalendar activeDate={overview?.today || new Date()} />

                {/* Daily Summary Capsule */}
                <DailySummaryCard
                  count={
                    role === 'NURSE'
                      ? overview?.tasks?.temperatures?.pending ?? 36
                      : role === 'DOCTOR'
                      ? overview?.tasks?.visits?.pending ?? 56
                      : overview?.discharges?.readyForCheckout ?? 3
                  }
                  label={
                    role === 'NURSE'
                      ? 'Checks Pending'
                      : role === 'DOCTOR'
                      ? 'Visits Pending'
                      : 'Ready for Checkout'
                  }
                  onClick={() => {
                    if (role === 'NURSE') navigate('/nurse/worklist');
                    else if (role === 'DOCTOR') navigate('/doctor/rounds');
                    else navigate('/admin/discharges');
                  }}
                />

                {/* Active Ward Context Feed */}
                <div>
                  <div className="flex items-center justify-between px-1 mb-1 text-[11px] font-semibold text-slate-400">
                    <span>Active Cases</span>
                    <span className="text-[10px] text-brand-blue">
                      {overview?.rooms?.occupied || 74} in Ward
                    </span>
                  </div>
                  <SidebarPatientList
                    patients={[
                      { id: '1', roomNumber: '03', name: 'Asha Verma', sublabel: 'Fever 38.6 °C', todayReading: { isFever: true, valueC: 38.6 } },
                      { id: '2', roomNumber: '12', name: 'S. Iyer', sublabel: '3/3 Afebrile', todayReading: { isFever: false, valueC: 37.1 } },
                      { id: '3', roomNumber: '41', name: 'R. Menon', sublabel: 'Critical 40.2 °C', todayReading: { isFever: true, isCritical: true, valueC: 40.2 } },
                      { id: '4', roomNumber: '24', name: 'Vikram Joshi', sublabel: 'Pending check', todayReading: null },
                    ]}
                    onSelectPatient={(p) => navigate(`/patients`)}
                  />
                </div>
              </div>

              {/* Bottom Persona Card */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <div className="min-w-0">
                  <div className="font-semibold text-white truncate text-[11px]">{user?.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{user?.title || user?.role}</div>
                </div>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-brand-blue/20 text-brand-blue font-bold">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* MAIN WORKSPACE (Reference Section 4.4 & 5.1)               */}
        {/* ========================================================= */}
        <main className="flex-1 flex flex-col min-w-0 bg-surface overflow-y-auto p-4 md:p-6 lg:p-7">
          {/* Main Top Header (Reference Section 4.4) */}
          <header className="flex items-center justify-between gap-4 pb-4 mb-3 border-b border-line/60">
            {/* Left: Greeting + Role Identity */}
            <div>
              <h1 className="text-[18px] md:text-[20px] font-medium text-brand-ink leading-tight">
                Hello, {user?.name || 'Staff'}!
              </h1>
              <p className="text-[11px] text-text-secondary mt-0.5">
                WardLine Quarantine & Treatment Facility · {user?.title || user?.role}
              </p>
            </div>

            {/* Right: Persona Switcher, Simulated Date, Demo Drawer Trigger, Search */}
            <div className="flex items-center gap-2">
              {/* Demo Persona Switcher Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                  className="flex items-center gap-2 bg-white border border-line px-2.5 py-1.5 rounded-lg text-xs font-medium text-text-primary hover:bg-slate-50 transition-colors shadow-xs"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="truncate max-w-[120px]">{user?.name} ({user?.role})</span>
                  <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
                </button>

                {showPersonaMenu && (
                  <div className="absolute right-0 mt-1 w-56 bg-white border border-line rounded-xl shadow-xl p-1.5 z-50 text-xs">
                    <div className="px-2 py-1 text-[10px] uppercase font-bold text-text-muted tracking-wider">
                      Switch Demo Persona
                    </div>
                    {personas.map((p) => (
                      <button
                        key={p.id || p._id}
                        onClick={() => handlePersonaSwitch(p)}
                        className={cn(
                          'w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between hover:bg-slate-100 transition-colors',
                          user?.id === (p.id || p._id) && 'bg-blue-50 font-semibold text-brand-blue'
                        )}
                      >
                        <span className="truncate">{p.name}</span>
                        <span className="text-[9px] uppercase px-1 py-0.5 rounded bg-slate-100 text-slate-600">
                          {p.role}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Simulated Clock Badge */}
              <div
                onClick={() => setIsDemoDrawerOpen(true)}
                className="hidden sm:flex items-center gap-1.5 bg-slate-100 border border-slate-200/80 px-2.5 py-1.5 rounded-lg text-xs text-text-secondary cursor-pointer hover:bg-slate-200 transition-colors"
                title="Click to manage simulated time and demo tools"
              >
                <Calendar className="w-3.5 h-3.5 text-brand-blue" />
                <span className="font-semibold text-brand-ink tabular-nums">
                  {overview?.today || '2024-10-23'}
                </span>
                <span className="text-[10px] text-brand-blue font-medium bg-brand-blue/10 px-1 rounded">
                  Simulated
                </span>
              </div>

              {/* Demo Tools Button */}
              <button
                onClick={() => setIsDemoDrawerOpen(true)}
                className="flex items-center gap-1.5 bg-brand-ink text-white px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors shadow-xs"
                title="Open Demo & Evaluation Tools"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#E3B9DF]" />
                <span className="hidden md:inline">Demo Tools</span>
              </button>
            </div>
          </header>

          {/* Alert Banner (Only when WARNING or BREACH) */}
          <AlertBanner
            mortality={overview?.mortality}
            onNavigateAnalytics={() => navigate('/director/analytics')}
          />

          {/* Ward Summary KPI Strip */}
          <div className="flex items-center justify-between gap-3 text-xs bg-surface-pure border border-line/60 rounded-xl px-4 py-2 mb-4 shadow-2xs overflow-x-auto">
            <div className="flex items-center gap-4 shrink-0">
              <span className="text-text-muted">
                Temperatures Today:{' '}
                <strong className="text-brand-ink tabular-nums">
                  {overview?.tasks?.temperatures?.done || 38}/{overview?.rooms?.occupied || 74}
                </strong>
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-text-muted">
                Doctor Visits Today:{' '}
                <strong className="text-brand-ink tabular-nums">
                  {overview?.tasks?.visits?.done || 18}/{overview?.rooms?.occupied || 74}
                </strong>
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-text-muted">
                Free Rooms:{' '}
                <strong
                  className={cn(
                    'tabular-nums font-bold',
                    overview?.rooms?.free > 0 ? 'text-success' : 'text-fever'
                  )}
                >
                  {overview?.rooms?.free ?? 0}/{overview?.rooms?.total ?? 74}
                </strong>
              </span>
            </div>

            <div className="text-[11px] text-text-muted hidden md:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live MongoDB Atlas Sync (20s interval)</span>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-h-0">
            <Outlet />
          </div>

          {/* Prototype Evaluation Footer */}
          <footer className="mt-6 pt-3 border-t border-line/40 flex flex-col sm:flex-row items-center justify-between text-[11px] text-text-muted gap-2">
            <span>
              Prototype for evaluation. Uses simulated data. Not for clinical use.
            </span>
            <div className="flex items-center gap-3">
              <NavLink to="/audit" className="hover:text-brand-blue transition-colors">
                Audit Log
              </NavLink>
              <span>·</span>
              <NavLink to="/director/settings" className="hover:text-brand-blue transition-colors">
                Settings
              </NavLink>
              <span>·</span>
              <a
                href="https://github.com/T4RuN05/WardLine---Factwise"
                target="_blank"
                rel="noreferrer"
                className="hover:text-brand-blue underline"
              >
                GitHub Repository
              </a>
            </div>
          </footer>
        </main>
      </div>

      {/* Demo Controls Drawer */}
      <DemoDrawer isOpen={isDemoDrawerOpen} onClose={() => setIsDemoDrawerOpen(false)} />
    </div>
  );
}
