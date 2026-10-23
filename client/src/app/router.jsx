import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from './AppShell.jsx';
import { RequireRole } from './RequireRole.jsx';

// Role workflow screens
import { OverviewScreen } from '../features/overview/OverviewScreen.jsx';
import { NurseWorklistScreen } from '../features/nurse/NurseWorklistScreen.jsx';
import { DoctorRoundsScreen } from '../features/doctor/DoctorRoundsScreen.jsx';
import { DoctorVisitScreen } from '../features/doctor/DoctorVisitScreen.jsx';
import { BedMapScreen } from '../features/admin/BedMapScreen.jsx';
import { DischargeQueueScreen } from '../features/admin/DischargeQueueScreen.jsx';
import { PatientsListScreen } from '../features/patients/PatientsListScreen.jsx';
import { AdmitPatientScreen } from '../features/patients/AdmitPatientScreen.jsx';
import { PatientProfileScreen } from '../features/patients/PatientProfileScreen.jsx';
import { DirectorAnalyticsScreen } from '../features/director/DirectorAnalyticsScreen.jsx';
import { SettingsScreen } from '../features/director/SettingsScreen.jsx';
import { AuditLogScreen } from '../features/audit/AuditLogScreen.jsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <OverviewScreen />,
      },
      {
        path: 'nurse/worklist',
        element: (
          <RequireRole allowedRoles={['NURSE', 'DIRECTOR']}>
            <NurseWorklistScreen />
          </RequireRole>
        ),
      },
      {
        path: 'doctor/rounds',
        element: (
          <RequireRole allowedRoles={['DOCTOR', 'DIRECTOR']}>
            <DoctorRoundsScreen />
          </RequireRole>
        ),
      },
      {
        path: 'doctor/visit/:patientId',
        element: (
          <RequireRole allowedRoles={['DOCTOR', 'DIRECTOR']}>
            <DoctorVisitScreen />
          </RequireRole>
        ),
      },
      {
        path: 'admin/beds',
        element: <BedMapScreen />,
      },
      {
        path: 'admin/discharges',
        element: (
          <RequireRole allowedRoles={['DOCTOR', 'ADMIN', 'DIRECTOR']}>
            <DischargeQueueScreen />
          </RequireRole>
        ),
      },
      {
        path: 'patients',
        element: <PatientsListScreen />,
      },
      {
        path: 'patients/new',
        element: (
          <RequireRole allowedRoles={['NURSE', 'ADMIN', 'DIRECTOR']}>
            <AdmitPatientScreen />
          </RequireRole>
        ),
      },
      {
        path: 'patients/:id',
        element: <PatientProfileScreen />,
      },
      {
        path: 'director/analytics',
        element: (
          <RequireRole allowedRoles={['DIRECTOR']}>
            <DirectorAnalyticsScreen />
          </RequireRole>
        ),
      },
      {
        path: 'director/settings',
        element: <SettingsScreen />,
      },
      {
        path: 'audit',
        element: <AuditLogScreen />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
