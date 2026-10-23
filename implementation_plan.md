# WardLine Implementation Plan

**Project:** WardLine — Quarantine & Treatment Facility Management App  
**Specification:** [`architecture.md`](./architecture.md) & [`README.md`](./README.md)  
**Status:** In Progress  
**Current Phase:** Phase 0 (Workspace Setup & Repository Scaffold)

---

## Progress Overview

| Phase | Description | Status | Completed At | Notes |
|---|---|:---:|:---:|---|
| **Phase 0** | Workspace Setup & Repository Scaffold | [x] Completed | 2026-10-23 | Git init, server & client skeletons, dependencies, Vite + Tailwind config |
| **Phase 1** | Pure Domain Core & Unit Tests | [x] Completed | 2026-10-23 | 39 Vitest domain tests passing: dates, temperature, tasks, eligibility, metrics, permissions |
| **Phase 2** | MongoDB Models & Schema Indexes | [x] Completed | 2026-10-23 | All 9 Mongoose models, compound unique partial indexes for active readings and daily visits, transaction support |
| **Phase 3** | Backend API, Middleware, Auth & Services | [x] Completed | 2026-10-23 | Full Express API, JWT auth, validation, transactional services (admit, temp, visit, discharge, death), audit log |
| **Phase 4** | Synthetic Seed & Demo Simulation Tools | [x] Completed | 2026-10-23 | Deterministic seed on Atlas: 74 occupied rooms, 38 done/36 pending, 50 closed cases (14.0% WARNING), 50 tests passing |
| **Phase 5** | Frontend Shell, Design System & Native State | [x] In Progress | - | Tailwind tokens, typography, AppShell, AlertBanner, AuthContext, AppDataContext |
| **Phase 6** | Role Workflow Screens (Nurse, Doctor, Admin) | [ ] Pending | - | Nurse worklist, Bedside sheet, Doctor rounds, Visit chart, Bed map (74 tiles), Discharge queue, Patient admission |
| **Phase 7** | Director Analytics, Audit Log & Settings | [ ] Pending | - | Mortality gauge vs 15% benchmark, delay SLA, audit table, settings |
| **Phase 8** | Testing, Demo Script Verification & Git History | [ ] Pending | - | Vitest suites, full 6-minute demo script verification, polish |

---

## Detailed Phase Tasks

### Phase 0: Workspace Setup & Repository Scaffold
- [x] Git repository initialized (`git init`)
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
- [x] Deterministic dataset: 74 occupied rooms, clinical state distribution, 50 closed cases (43 discharged, 7 deceased = 14.0% WARNING)
- [x] Demo controllers: persona login, clock advance, auto-fill today, reset to seed
- [x] Integration tests verifying API behavior and seed state (50/50 tests passing!)

### Phase 5: Frontend Design System, Shell & Core State (WP6)
- [ ] Clinical design tokens (`tokens.css`, typography: Atkinson Hyperlegible & Barlow Condensed)
- [ ] `AuthContext.jsx` with demo persona login/switcher
- [ ] `AppDataContext.jsx` with native React `useReducer` and polling / focus refetching
- [ ] API client wrapper (`client/src/lib/api.js`)
- [ ] `AppShell.jsx` with simulated date, persona switcher, demo drawer button, mortality alert banner, occupancy strip
- [ ] UI component library (Button, Modal, Sheet, Badge, SegmentedControl, Table, Tooltip)

### Phase 6: Role Workflow Screens (WP7, WP8, WP9)
- [ ] Nurse Worklist (`/nurse/worklist`): Pending / Done tabs, Bedside `RecordTemperatureSheet`, step buttons, duplicate dialog, reason correction dialog
- [ ] Doctor Rounds (`/doctor/rounds`): Priority sorting, status pills, awaiting temperature disabled state
- [ ] Visit Form (`/doctor/visit/:patientId`): 14-day temperature chart, streak dots, clinical status, notes, addendum flow, approve discharge dialog, record death dialog
- [ ] Bed Map (`/admin/beds`): 74-room interactive grid grouped by ward, status markers, slide-out drawer, instant capacity updates
- [ ] Discharge Queue (`/admin/discharges`): Awaiting approval & ready for checkout queues, overdue SLA badges, checkout action
- [ ] Patient Directory (`/patients`, `/patients/new`, `/patients/:id`): Search, ward filters, admission form with free room selection and duplicate warning, full clinical profile

### Phase 7: Director Analytics, Audit Log & Settings (WP10)
- [ ] Director Analytics (`/director/analytics`): Mortality gauge vs 15% benchmark, closed cases count, success rate vs 85%, occupancy, task completion rates, discharge delay SLA
- [ ] Audit Log (`/audit`): Filterable, searchable chronological table
- [ ] Facility Settings (`/director/settings`): Read and update configurable thresholds

### Phase 8: End-to-End Verification & Walkthrough (WP11)
- [ ] Full backend and frontend test execution
- [ ] Complete 6-minute evaluation script verification across all 4 roles
- [ ] Final documentation, README links, and git commits
