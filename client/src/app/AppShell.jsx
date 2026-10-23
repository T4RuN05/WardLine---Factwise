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
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
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
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('wardline_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('wardline_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const closeMobileNav = () => setIsMobileNavOpen(false);

  const role = user?.role || 'NURSE';

  // Navigation Items with role highlighting
  const navItems = [
    { to: '/', label: 'Overview', icon: Grid, roles: ['NURSE', 'DOCTOR', 'ADMIN', 'DIRECTOR'] },
    { to: '/nurse/worklist', label: 'Nurse Worklist', icon: Thermometer, roles: ['NURSE', 'DOCTOR', 'ADMIN', 'DIRECTOR'] },
    { to: '/doctor/rounds', label: 'Doctor Rounds', icon: Stethoscope, roles: ['NURSE', 'DOCTOR', 'ADMIN', 'DIRECTOR'] },
    { to: '/admin/beds', label: 'Bed Map (74 Rooms)', icon: Layers, roles: ['NURSE', 'DOCTOR', 'ADMIN', 'DIRECTOR'] },
    { to: '/admin/discharges', label: 'Discharge Queue', icon: ClipboardList, roles: ['NURSE', 'DOCTOR', 'ADMIN', 'DIRECTOR'] },
    { to: '/patients', label: 'Patient Directory', icon: Users, roles: ['NURSE', 'DOCTOR', 'ADMIN', 'DIRECTOR'] },
    { to: '/director/analytics', label: 'Director Analytics', icon: Activity, roles: ['DIRECTOR'] },
  ];

  const visibleNav = navItems.filter((item) => item.roles.includes(role));

  const handlePersonaSwitch = async (pUser) => {
    setShowPersonaMenu(false);
    await loginAsDemoUser(pUser.id || pUser._id);
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-canvas p-0 sm:p-2 md:p-3 flex items-center justify-center font-sans antialiased text-text-primary">
      {/* Outer Application Frame matching Reference x=64/y=65 radius-app */}
      <div className="w-full max-w-[1560px] 2xl:max-w-none h-screen sm:h-[calc(100vh-1rem)] md:h-[calc(100vh-1.5rem)] bg-surface rounded-none sm:rounded-app shadow-sm border-0 sm:border sm:border-line/50 flex overflow-hidden">
        {/* ========================================================= */}
        {/* LEFT TWO-PART SIDEBAR (Reference Section 4.1 & 4.2)      */}
        {/* ========================================================= */}
        <aside
          className={cn(
            'hidden lg:flex bg-sidebar text-white shrink-0 my-2 ml-2 rounded-sidebar flex-col overflow-hidden shadow-md transition-all duration-300 ease-in-out',
            isSidebarCollapsed ? 'w-[58px]' : 'w-[280px] xl:w-[310px]'
          )}
        >
          <div className="flex h-full min-h-0">
            {/* 1. Icon Rail (Reference Section 4.2) */}
            <div className="w-[58px] bg-sidebar border-r border-white/5 py-3 flex flex-col items-center justify-between shrink-0 h-full">
              <div className="flex flex-col items-center gap-2">
                {/* Brand Logo Mark */}
                <div
                  onClick={() => navigate('/')}
                  className="w-8 h-8 rounded-xl bg-brand-blue/20 text-brand-blue flex items-center justify-center cursor-pointer hover:bg-brand-blue/30 transition-colors"
                  title="WardLine Quarantine Centre"
                >
                  <HeartPulse className="w-5 h-5 text-brand-blue" />
                </div>

                {/* Sidebar Collapse/Expand Toggle Button in rail */}
                <button
                  onClick={toggleSidebar}
                  title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {isSidebarCollapsed ? (
                    <PanelLeftOpen className="w-4 h-4 text-brand-blue" />
                  ) : (
                    <PanelLeftClose className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {/* Primary Navigation Icons */}
                <div className="flex flex-col items-center gap-1.5 mt-1">
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
            {!isSidebarCollapsed && (
              <div className="flex-1 p-3 flex flex-col justify-between h-full min-h-0 overflow-hidden animate-in fade-in duration-200">
                <div className="space-y-2.5 overflow-y-auto pr-0.5 min-h-0">
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
                      if (role === 'DOCTOR') navigate('/doctor/rounds');
                      else if (role === 'ADMIN') navigate('/admin/discharges');
                      else navigate('/nurse/worklist');
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
                    <div className="max-h-[140px] xl:max-h-[180px] overflow-y-auto">
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
                </div>

                {/* Bottom Persona Card */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs shrink-0 mt-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-white truncate text-[11px]">{user?.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{user?.title || user?.role}</div>
                  </div>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-brand-blue/20 text-brand-blue font-bold">
                    {user?.role}
                  </span>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ========================================================= */}
        {/* MAIN WORKSPACE (Reference Section 4.4 & 5.1)               */}
        {/* ========================================================= */}
        <main className="flex-1 flex flex-col min-w-0 bg-surface overflow-y-auto p-4 md:p-6 lg:p-7 h-full min-h-0">
          {/* Main Top Header (Reference Section 4.4) */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-3 border-b border-line/60 shrink-0">
            {/* Left: Collapse toggle + Greeting + Role Identity */}
            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
              <button
                onClick={() => setIsMobileNavOpen(true)}
                className="lg:hidden flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar text-brand-blue shadow-xs transition-colors hover:bg-slate-800 hover:text-white"
                title="Open navigation"
                aria-label="Open navigation"
              >
                <Menu className="h-4 w-4" />
              </button>
              <button
                onClick={toggleSidebar}
                className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg border border-line bg-white text-text-muted hover:text-brand-ink transition-colors shadow-xs"
                title={isSidebarCollapsed ? 'Expand sidebar panel' : 'Collapse sidebar panel'}
              >
                {isSidebarCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4 text-brand-blue" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>
              <div>
                <h1 className="text-[18px] md:text-[20px] font-medium text-brand-ink leading-tight">
                  Hello, {user?.name || 'Staff'}!
                </h1>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  WardLine Quarantine & Treatment Facility · {user?.title || user?.role}
                </p>
              </div>
            </div>

            {/* Right: Persona Switcher, Simulated Date, Demo Drawer Trigger, Search */}
            <div className="flex w-full sm:w-auto flex-wrap items-center justify-end gap-2">
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
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-line rounded-lg text-xs font-mono text-text-secondary shadow-xs">
                <Calendar className="w-3.5 h-3.5 text-brand-blue" />
                <span>{overview?.today || '2026-10-23'}</span>
                <span className="text-[10px] text-text-muted uppercase">Simulated</span>
              </div>

              {/* Demo Tools Drawer Trigger */}
              <button
                onClick={() => setIsDemoDrawerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-ink text-white hover:bg-slate-800 transition-colors shadow-xs"
                title="Open Simulator Drawer"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-pink" />
                <span className="hidden sm:inline">Demo Tools</span>
              </button>
            </div>
          </header>

          {/* Mortality Alert Banner (Prominent in Warning/Breach state) */}
          <AlertBanner
            mortality={overview?.mortality}
            onNavigateAnalytics={() => navigate('/director/analytics')}
          />

          {/* Live Ward Capacity Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs py-1.5 px-3 bg-white/70 border border-line/50 rounded-lg mb-3 shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-[11px]">
              <div>
                <span className="text-text-muted">Temperatures Today:</span>{' '}
                <span className="font-semibold text-brand-ink tabular-nums">
                  {overview?.tasks?.temperatures?.done ?? 38}/{overview?.rooms?.occupied ?? 74}
                </span>
              </div>
              <span className="text-slate-300">|</span>
              <div>
                <span className="text-text-muted">Doctor Visits Today:</span>{' '}
                <span className="font-semibold text-brand-ink tabular-nums">
                  {overview?.tasks?.visits?.done ?? 18}/{overview?.rooms?.occupied ?? 74}
                </span>
              </div>
              <span className="text-slate-300">|</span>
              <div>
                <span className="text-text-muted">Free Rooms:</span>{' '}
                <span className={cn('font-semibold tabular-nums', (overview?.rooms?.free ?? 0) === 0 ? 'text-fever' : 'text-success')}>
                  {overview?.rooms?.free ?? 0}/{overview?.rooms?.total ?? 74}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live MongoDB Atlas Sync (20s interval)</span>
            </div>
          </div>

          {/* Child Route Screen Viewport */}
          <div className="flex-1 w-full pb-6">
            <Outlet />
          </div>

          {/* Subdued Prototype Notice Footer */}
          <footer className="pt-6 pb-2 mt-auto border-t border-line/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] text-text-muted shrink-0">
            <span>Prototype for evaluation. Uses simulated data. Not for clinical use.</span>
            <div className="flex items-center gap-3">
              <NavLink to="/audit" className="hover:underline">Audit Log</NavLink>
              <NavLink to="/director/settings" className="hover:underline">Settings</NavLink>
              <a
                href="https://github.com/T4RuN05/WardLine---Factwise"
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                GitHub Repository
              </a>
            </div>
          </footer>
        </main>
      </div>

      {/* Mobile navigation drawer */}
      {isMobileNavOpen && (
        <>
          <button
            aria-label="Close navigation"
            className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden"
            onClick={closeMobileNav}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[min(86vw,320px)] flex-col bg-sidebar text-white shadow-2xl lg:hidden animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-blue/20 text-brand-blue">
                  <HeartPulse className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">WardLine</div>
                  <div className="text-[10px] text-slate-400">Facility workspace</div>
                </div>
              </div>
              <button
                onClick={closeMobileNav}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
                title="Close navigation"
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {visibleNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={closeMobileNav}
                    className={({ isActive }) => cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                      isActive
                        ? 'bg-brand-blue text-white shadow-xs'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
              <div className="my-3 border-t border-white/10" />
              <NavLink
                to="/audit"
                onClick={closeMobileNav}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                  isActive ? 'bg-brand-blue text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                )}
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Audit Trail</span>
              </NavLink>
              <NavLink
                to="/director/settings"
                onClick={closeMobileNav}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                  isActive ? 'bg-brand-blue text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                )}
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </NavLink>
            </nav>
            <div className="border-t border-white/10 p-4">
              <div className="mb-3 min-w-0">
                <div className="truncate text-xs font-semibold text-white">{user?.name || 'Staff'}</div>
                <div className="truncate text-[10px] text-slate-400">{user?.title || user?.role || 'Facility staff'}</div>
              </div>
              <button
                onClick={() => { closeMobileNav(); logout(); }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs text-slate-400 hover:bg-white/10 hover:text-fever"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Floating Demo Drawer Modal */}
      <DemoDrawer
        isOpen={isDemoDrawerOpen}
        onClose={() => setIsDemoDrawerOpen(false)}
      />
    </div>
  );
}
