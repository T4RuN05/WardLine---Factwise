# WardLine Implementation Plan

**Project:** WardLine — Quarantine & Treatment Facility Management App  
**Specification:** [`architecture.md`](./architecture.md) & [`README.md`](./README.md)  
**Design Reference:** [`wardline-design-reference.md`](./wardline-design-reference.md)  
**Status:** Completed & Verified  
**Current Phase:** Phase 8 (Verification, Walkthrough & Git Push)

---

## Progress Overview

| Phase | Description | Status | Completed At | Notes |
|---|---|:---:|:---:|---|
| **Phase 0** | Workspace Setup & Repository Scaffold | [x] Completed | 2026-10-23 | Git init, server & client skeletons, dependencies, Vite + Tailwind config |
| **Phase 1** | Pure Domain Core & Unit Tests | [x] Completed | 2026-10-23 | 39 Vitest domain tests passing: dates, temperature, tasks, eligibility, metrics, permissions |
| **Phase 2** | MongoDB Models & Schema Indexes | [x] Completed | 2026-10-23 | All 9 Mongoose models, compound unique partial indexes for active readings and daily visits, transaction support |
| **Phase 3** | Backend API, Middleware, Auth & Services | [x] Completed | 2026-10-23 | Full Express API, JWT auth, validation, transactional services (admit, temp, visit, discharge, death), audit log |
| **Phase 4** | Synthetic Seed & Demo Simulation Tools | [x] Completed | 2026-10-23 | Deterministic seed on Atlas: 74 occupied rooms, 38 done/36 pending, 50 closed cases (14.0% WARNING), 50 tests passing |
| **Phase 5** | Frontend Shell, Design System & Native State | [x] Completed | 2026-10-23 | Dribbble visual tokens, Inter font, AppShell two-part dark sidebar, AlertBanner, AuthContext, AppDataContext |
| **Phase 6** | Role Workflow Screens (Nurse, Doctor, Admin) | [x] Completed | 2026-10-23 | Nurse worklist, Bedside sheet, Doctor rounds, Visit chart, Bed map (74 tiles), Discharge queue, Patient directory & intake |
| **Phase 7** | Director Analytics, Audit Log & Settings | [x] Completed | 2026-10-23 | Mortality gauge vs 15% benchmark, outcomes bar chart, immutable audit trail, configurable thresholds |
| **Phase 8** | Testing, Demo Script Verification & Git History | [x] Completed | 2026-10-23 | 50/50 backend tests passing, 10/10 frontend tests passing, Vite production bundle compiled, git committed |

---

## Detailed Phase Tasks

### Phase 0: Workspace Setup & Repository Scaffold
- [x] Git repository initialized (`git init`)
- [x] Remote repository linked: `https://github.com/T4RuN05/WardLine---Factwise.git`
- [x] Root `.gitignore` and `package.json` for convenience scripts
- [x] `server/` directory setup with Express, Mongoose, Zod, JWT, Vitest dependencies
- [x] `client/` directory setup with Vite, React, Tailwind CSS, Lucide, Radix, Sonner, Recharts
- [x] Environment file templates (`server/.env.example`, `client/.env.example`, `client/.env.local`)
- [x] Initial health check verification

### Phase 1: Domain Core & Domain Unit Tests (WP1)
- [x] `server/src/domain/errors.js` (DomainError codes)
- [x] `server/src/domain/dates.js` (facility date timezone calculations)
- [x] `server/src/domain/temperature.js` (classifyTemperature, bounds, soft-confirm)
- [x] `server/src/domain/tasks.js` (getTaskStatus, sortDoctorRounds)
- [x] `server/src/domain/eligibility.js` (computeStreak, 3-consecutive afebrile days, stale check)
- [x] `server/src/domain/metrics.js` (computeMortality, benchmark, warning, breach)
- [x] `server/src/domain/permissions.js` (role matrix, `can(role, action)`)
- [x] Vitest test suite covering all rule IDs (TMP, TSK, VIS, DIS, DEC, MET, ACL) — 39 tests passing!

### Phase 2: MongoDB Models & Database Configuration (WP2)
- [x] MongoDB connection with transaction session helper (`server/src/config/database.js`)
- [x] `User.js` model
- [x] `Room.js` model (74 rooms, unique number)
- [x] `Patient.js` model (MRN sequential, status lifecycle)
- [x] `TemperatureReading.js` model (unique partial compound index on `{ patientId, date }` where `isActive: true`)
- [x] `DoctorVisit.js` model (unique compound index on `{ patientId, date }`)
- [x] `DischargeRecord.js` model (eligibility cycle tracking)
- [x] `DeathRecord.js` model (unique patientId)
- [x] `FacilitySettings.js` model
- [x] `AuditEvent.js` model (append-only)
- [x] Schema & index integration tests passing

### Phase 3: Backend API, Middleware, Auth & Services (WP3 & WP4)
- [x] Clock service (`clock.js`) supporting simulated time
- [x] Express middleware: `authenticate.js`, `authorize.js`, `validate.js`, `errorHandler.js`, `requestId.js`
- [x] Mutation services with transactional guarantees:
  - `admissionService.js` (ADM-1 to ADM-7)
  - `temperatureService.js` (TMP-1 to TMP-11, auto-revocation DIS-6/7)
  - `visitService.js` (VIS-1 to VIS-7)
  - `dischargeService.js` (DIS-1 to DIS-9)
  - `deathService.js` (DEC-1 to DEC-4)
- [x] Read services: Overview, Nurse worklist, Doctor rounds, Bed map, Discharge queue, Director analytics, Audit log
- [x] Express routes & controllers conforming to the standardized JSON envelope

### Phase 4: Synthetic Seed & Demo Tools (WP5)
- [x] Seed generator (`names.js`, `prng.js`, `seed.js`)
- [x] Deterministic dataset on Atlas: 74 occupied rooms, clinical state distribution, 50 closed cases (43 discharged, 7 deceased = 14.0% WARNING)
- [x] Demo controllers: persona login, clock advance, auto-fill today, reset to seed
- [x] Integration tests verifying API behavior and seed state (50/50 tests passing!)

### Phase 5: Frontend Design System, Shell & Core State (WP6)
- [x] Clinical design tokens (`tokens.css` with `#131315`, `#E7EAEC`, `#8AADDB`, `#E3B9DF`, Inter font)
- [x] `AuthContext.jsx` with demo persona login/switcher and token management
- [x] `AppDataContext.jsx` with native React `useReducer` and polling / focus refetching
- [x] API client wrapper (`client/src/lib/api.js`) with endpoint normalization
- [x] `AppShell.jsx` with two-part dark sidebar, MiniCalendar, DailySummaryCard, SidebarPatientList, MainHeader, and DemoDrawer
- [x] UI component library (`MetricCard`, `MonthlyBarChartCard`, `CompletionGaugeCard`, `StatusBadge`, `StreakDots`, `Modal`, `ReasonDialog`, `Button`, `AlertBanner`)

### Phase 6: Role Workflow Screens (WP7, WP8, WP9)
- [x] Nurse Worklist (`/nurse/worklist`): Pending / Done tabs, Bedside `RecordTemperatureSheet`, step buttons, duplicate dialog, reason correction dialog
- [x] Doctor Rounds (`/doctor/rounds`): Priority sorting, status pills, awaiting temperature disabled state
- [x] Visit Form (`/doctor/visit/:patientId`): 14-day temperature chart, streak dots, clinical status, notes, addendum flow, approve discharge dialog, record death dialog
- [x] Bed Map (`/admin/beds`): 74-room interactive grid grouped by ward, status markers, slide-out drawer, instant capacity updates
- [x] Discharge Queue (`/admin/discharges`): Awaiting approval & ready for checkout queues, overdue SLA badges, checkout action
- [x] Patient Directory (`/patients`, `/patients/new`, `/patients/:id`): Search, ward filters, admission form with free room selection and duplicate warning, full clinical profile

### Phase 7: Director Analytics, Audit Log & Settings (WP10)
- [x] Director Analytics (`/director/analytics`): Mortality gauge vs 15% benchmark, closed cases count, success rate vs 85%, occupancy, task completion rates, discharge delay SLA
- [x] Audit Log (`/audit`): Filterable, searchable immutable audit log table
- [x] Facility Settings (`/director/settings`): Read and update configurable thresholds with director access guard

### Phase 8: End-to-End Verification & Walkthrough (WP11)
- [x] Full backend test execution: 50/50 tests passing (Domain & Integration)
- [x] Full frontend test execution: 10/10 tests passing (Formatters & UI Components)
- [x] Production build validation: `vite build` completed cleanly without errors
- [x] Fixed null safety bug on `todayReading` in `SidebarPatientList.jsx`
- [x] Push all changes to Git remote repository
