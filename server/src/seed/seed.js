import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import { env } from '../config/env.js';
import {
  User,
  Room,
  Patient,
  TemperatureReading,
  DoctorVisit,
  DischargeRecord,
  DeathRecord,
  FacilitySettings,
  AuditEvent,
} from '../models/index.js';
import { createPRNG } from './prng.js';
import { FIRST_NAMES_M, FIRST_NAMES_F, LAST_NAMES } from './names.js';
import { subDays, getFacilityDate } from '../domain/dates.js';

export async function seedDatabase(isReset = false) {
  console.log(`[Seed] Starting seed process (isReset: ${isReset})...`);
  const prng = createPRNG(42); // Fixed seed for reproducible fixtures

  // Clear existing collections if resetting or fresh seed
  await Promise.all([
    User.deleteMany({}),
    Room.deleteMany({}),
    Patient.deleteMany({}),
    TemperatureReading.deleteMany({}),
    DoctorVisit.deleteMany({}),
    DischargeRecord.deleteMany({}),
    DeathRecord.deleteMany({}),
    FacilitySettings.deleteMany({}),
    AuditEvent.deleteMany({}),
  ]);

  // 1. Anchor facility date & clock
  const anchorDateStr = getFacilityDate(new Date(), env.FACILITY_TIMEZONE);
  const now = new Date();

  // 2. Create Facility Settings
  const settings = await FacilitySettings.create({
    facilityName: 'WardLine Quarantine & Treatment Centre',
    capacity: 74,
    feverThresholdC: 38.0,
    criticalThresholdC: 40.0,
    requiredFeverFreeDays: 3,
    mortalityBenchmark: 0.15,
    mortalityWarningRatio: 0.12,
    minClosedCasesForAlert: 20,
    requireDoctorApproval: true,
    approvedNotDischargedSlaHours: 4,
    facilityTimezone: env.FACILITY_TIMEZONE,
    demoClockNow: now,
  });

  // 3. Create Demo Users (4 Roles)
  const users = await User.create([
    {
      name: 'Meera Patel',
      role: 'NURSE',
      title: 'Senior Ward Nurse',
      isActive: true,
      demoPersona: true,
    },
    {
      name: 'Aarav Sharma',
      role: 'NURSE',
      title: 'Floor Staff Nurse',
      isActive: true,
      demoPersona: true,
    },
    {
      name: 'Priya Nair',
      role: 'NURSE',
      title: 'Triage Nurse',
      isActive: true,
      demoPersona: true,
    },
    {
      name: 'Dr. Rajesh Varma',
      role: 'DOCTOR',
      title: 'Treating Physician',
      isActive: true,
      demoPersona: true,
    },
    {
      name: 'Dr. Sunita Rao',
      role: 'DOCTOR',
      title: 'Infectious Disease Specialist',
      isActive: true,
      demoPersona: true,
    },
    {
      name: 'Dr. Vikram Seth',
      role: 'DOCTOR',
      title: 'Attending Physician',
      isActive: true,
      demoPersona: true,
    },
    {
      name: 'Kavita Sen',
      role: 'ADMIN',
      title: 'Bed Manager & Admissions Officer',
      isActive: true,
      demoPersona: true,
    },
    {
      name: 'Anand Joshi',
      role: 'ADMIN',
      title: 'Facility Coordinator',
      isActive: true,
      demoPersona: true,
    },
    {
      name: 'Dr. Ashok Mehta',
      role: 'DIRECTOR',
      title: 'Head Doctor & Centre Director',
      isActive: true,
      demoPersona: true,
    },
  ]);

  const nurseUser = users.find((u) => u.name === 'Meera Patel');
  const doctorUser = users.find((u) => u.name === 'Dr. Rajesh Varma');
  const adminUser = users.find((u) => u.name === 'Kavita Sen');
  const directorUser = users.find((u) => u.name === 'Dr. Ashok Mehta');

  // 4. Create 74 Rooms (Wards A, B, C, D)
  const roomsData = [];
  for (let num = 1; num <= 74; num++) {
    let ward = 'A';
    if (num >= 20 && num <= 37) ward = 'B';
    else if (num >= 38 && num <= 56) ward = 'C';
    else if (num >= 57) ward = 'D';

    roomsData.push({
      number: num,
      ward,
      status: 'OCCUPIED', // Initial state: 74/74 full per product brief
      patientId: null,
    });
  }
  const rooms = await Room.create(roomsData);

  // Helper name generator
  function getRandomName(idx, isFemale) {
    const firstList = isFemale ? FIRST_NAMES_F : FIRST_NAMES_M;
    const first = firstList[idx % firstList.length];
    const last = LAST_NAMES[(idx * 7) % LAST_NAMES.length];
    return `${first} ${last}`;
  }

  // 5. Build 74 Active Patient Clinical Archetypes (Section 8.2)
  // Total 74:
  // - 14 Recently admitted (stay 1-3d, fever): 8 measured today (fever), 6 pending
  // - 16 Mid-treatment (stay 4-9d, fever persisting): 9 measured today (fever), 7 pending
  // - 8 Streak 1: 4 measured today (afebrile), 4 pending
  // - 9 Streak 2: 5 measured today (afebrile), 4 pending
  // - 6 Streak 3 & eligible (not approved): all 6 measured today; 2 eligible since yesterday (overdue approval)
  // - 3 Approved (awaiting checkout): all 3 measured today; 1 approved 5 hours ago (overdue checkout)
  // - 2 Critical: 2 measured today (40.2 and 40.5 C)
  // - 5 Missed yesterday (gap in series): 2 measured today, 3 pending
  // - 11 Stable afebrile (streak 0 due to relapse 2 days ago): 7 measured today, 4 pending
  // Aggregate today readings: 8 + 9 + 4 + 5 + 6 + 3 + 2 + 2 + 7 = 46 measured, 28 pending (roughly ~38-40 target).
  // Let's refine counts so exactly 38 measured, 36 pending:
  // - Recently admitted: 14 total -> 8 measured, 6 pending
  // - Mid-treatment: 16 total -> 8 measured, 8 pending
  // - Streak 1: 8 total -> 4 measured, 4 pending
  // - Streak 2: 9 total -> 4 measured, 5 pending
  // - Streak 3 & eligible: 6 total -> 6 measured, 0 pending
  // - Approved: 3 total -> 3 measured, 0 pending
  // - Critical: 2 total -> 2 measured, 0 pending
  // - Missed yesterday: 5 total -> 1 measured, 4 pending
  // - Relapsed/stable: 11 total -> 2 measured, 9 pending
  // Sum measured: 8 + 8 + 4 + 4 + 6 + 3 + 2 + 1 + 2 = 38 measured! Pending: 74 - 38 = 36 pending! Exactly matches Section 8.2 specification!

  const patientArchetypes = [];

  function addGroup(count, measuredCount, type) {
    for (let i = 0; i < count; i++) {
      patientArchetypes.push({
        type,
        measuredToday: i < measuredCount,
        indexInGroup: i,
      });
    }
  }

  addGroup(14, 8, 'RECENT_FEVER');
  addGroup(16, 8, 'MID_FEVER');
  addGroup(8, 4, 'STREAK_1');
  addGroup(9, 4, 'STREAK_2');
  addGroup(6, 6, 'STREAK_3_ELIGIBLE');
  addGroup(3, 3, 'APPROVED');
  addGroup(2, 2, 'CRITICAL');
  addGroup(5, 1, 'MISSED_YESTERDAY');
  addGroup(11, 2, 'RELAPSE');

  // Insert 74 active patients
  const createdPatients = [];
  const readingsToInsert = [];
  const visitsToInsert = [];
  const dischargesToInsert = [];

  for (let i = 0; i < 74; i++) {
    const room = rooms[i];
    const arch = patientArchetypes[i];
    const isFemale = i % 2 === 0;
    const name = getRandomName(i, isFemale);
    const age = 18 + Math.floor(prng() * 65);
    const mrn = `QF-${String(100 + i + 1).padStart(6, '0')}`;
    const phone = `+91 ${9800000000 + i}`;

    let admittedDaysAgo = 3;
    let status = 'ADMITTED';

    if (arch.type === 'RECENT_FEVER') admittedDaysAgo = 2;
    else if (arch.type === 'MID_FEVER') admittedDaysAgo = 7;
    else if (arch.type === 'STREAK_1') admittedDaysAgo = 5;
    else if (arch.type === 'STREAK_2') admittedDaysAgo = 6;
    else if (arch.type === 'STREAK_3_ELIGIBLE') admittedDaysAgo = 8;
    else if (arch.type === 'APPROVED') {
      admittedDaysAgo = 9;
      status = 'DISCHARGE_APPROVED';
    } else if (arch.type === 'CRITICAL') admittedDaysAgo = 4;
    else if (arch.type === 'MISSED_YESTERDAY') admittedDaysAgo = 6;
    else if (arch.type === 'RELAPSE') admittedDaysAgo = 10;

    const admittedOn = subDays(anchorDateStr, admittedDaysAgo);
    const admittedAt = new Date(now.getTime() - admittedDaysAgo * 24 * 3600 * 1000);

    const patient = new Patient({
      mrn,
      name,
      age,
      sex: isFemale ? 'F' : 'M',
      phone,
      emergencyContact: {
        name: `Contact of ${name.split(' ')[0]}`,
        phone: `+91 ${9700000000 + i}`,
        relationship: 'Family',
      },
      admittedOn,
      admittedAt,
      admittedBy: nurseUser._id,
      roomId: room._id,
      roomNumber: room.number,
      status,
      notes: `Admitted for monitoring. Presentation: ${arch.type}.`,
    });

    createdPatients.push(patient);
    room.patientId = patient._id;
  }

  // Save patients and link rooms
  await Patient.insertMany(createdPatients);
  await Promise.all(rooms.map((r) => r.save()));

  // 6. Generate Historical & Today's Temperature Readings and Doctor Visits
  let visitsCount = 0;

  for (let i = 0; i < 74; i++) {
    const patient = createdPatients[i];
    const arch = patientArchetypes[i];

    // Helper to add reading
    const addReading = (dateStr, val, isActive = true, overrideRole = 'NURSE') => {
      const isFever = val >= settings.feverThresholdC;
      const isCritical = val >= settings.criticalThresholdC;
      const readingTime = new Date(
        now.getTime() - (dateStr === anchorDateStr ? 3 * 3600 * 1000 : 24 * 3600 * 1000)
      );

      const r = new TemperatureReading({
        patientId: patient._id,
        date: dateStr,
        recordedAt: readingTime,
        valueC: val,
        recordedBy: overrideRole === 'DOCTOR' ? doctorUser._id : nurseUser._id,
        recordedByRole: overrideRole,
        isFever,
        isCritical,
        isActive,
      });
      readingsToInsert.push(r);
      return r;
    };

    const d0 = anchorDateStr;
    const d1 = subDays(anchorDateStr, 1);
    const d2 = subDays(anchorDateStr, 2);
    const d3 = subDays(anchorDateStr, 3);

    let todayReadingObj = null;

    if (arch.type === 'RECENT_FEVER') {
      addReading(d2, 38.6);
      addReading(d1, 38.4);
      if (arch.measuredToday) todayReadingObj = addReading(d0, 38.3);
    } else if (arch.type === 'MID_FEVER') {
      addReading(d3, 38.9);
      addReading(d2, 38.7);
      addReading(d1, 38.5);
      if (arch.measuredToday) todayReadingObj = addReading(d0, 38.4);
    } else if (arch.type === 'STREAK_1') {
      addReading(d2, 38.4); // fever
      addReading(d1, 38.2); // fever
      if (arch.measuredToday) todayReadingObj = addReading(d0, 37.1); // 1st afebrile day
    } else if (arch.type === 'STREAK_2') {
      addReading(d3, 38.5);
      addReading(d2, 38.3);
      addReading(d1, 37.0); // day 1 afebrile
      if (arch.measuredToday) todayReadingObj = addReading(d0, 36.9); // day 2 afebrile
    } else if (arch.type === 'STREAK_3_ELIGIBLE') {
      // 3 consecutive afebrile days!
      addReading(d3, 38.5);
      addReading(d2, 37.0); // afebrile
      addReading(d1, 36.8); // afebrile
      todayReadingObj = addReading(d0, 37.1); // 3rd afebrile!

      const eligibleSince = arch.indexInGroup < 2 ? d1 : d0;
      dischargesToInsert.push(
        new DischargeRecord({
          patientId: patient._id,
          eligibleOn: eligibleSince,
          history: [
            {
              at: new Date(now.getTime() - 24 * 3600 * 1000),
              action: 'BECAME_ELIGIBLE',
              note: `Eligible after 3 consecutive afebrile days ending ${eligibleSince}.`,
            },
          ],
        })
      );
    } else if (arch.type === 'APPROVED') {
      // Approved and awaiting admin checkout!
      addReading(d3, 37.2);
      addReading(d2, 37.0);
      addReading(d1, 36.9);
      todayReadingObj = addReading(d0, 36.8);

      const approvedHoursAgo = arch.indexInGroup === 0 ? 6 : 2; // arch 0 is overdue (> 4h SLA!)
      const approvedAt = new Date(now.getTime() - approvedHoursAgo * 3600 * 1000);

      dischargesToInsert.push(
        new DischargeRecord({
          patientId: patient._id,
          eligibleOn: d1,
          approvedAt,
          approvedBy: doctorUser._id,
          approvedByName: doctorUser.name,
          history: [
            {
              at: new Date(now.getTime() - 24 * 3600 * 1000),
              action: 'BECAME_ELIGIBLE',
              note: 'Eligible after 3 afebrile days.',
            },
            {
              at: approvedAt,
              action: 'APPROVED_BY_DOCTOR',
              actorId: doctorUser._id,
              actorName: doctorUser.name,
              note: `Approved by ${doctorUser.name}.`,
            },
          ],
        })
      );
    } else if (arch.type === 'CRITICAL') {
      addReading(d1, 39.8);
      const critVal = arch.indexInGroup === 0 ? 40.2 : 40.5;
      todayReadingObj = addReading(d0, critVal);
    } else if (arch.type === 'MISSED_YESTERDAY') {
      addReading(d2, 37.0);
      // d1 is missing! breaks streak (DIS-8)
      if (arch.measuredToday) todayReadingObj = addReading(d0, 36.9);
    } else if (arch.type === 'RELAPSE') {
      addReading(d3, 37.0);
      addReading(d2, 38.5); // relapse fever breaks streak
      addReading(d1, 37.2);
      if (arch.measuredToday) todayReadingObj = addReading(d0, 37.0);
    }

    // Add Doctor Visits for roughly 18 measured patients (TSK-6: only if reading exists today!)
    if (todayReadingObj && visitsCount < 18) {
      visitsCount++;
      const visitTime = new Date(now.getTime() - 1 * 3600 * 1000); // 1h ago, strictly after reading!
      visitsToInsert.push(
        new DoctorVisit({
          patientId: patient._id,
          date: d0,
          visitedAt: visitTime,
          doctorId: doctorUser._id,
          temperatureReadingId: todayReadingObj._id,
          clinicalStatus: arch.type === 'CRITICAL' ? 'CRITICAL' : 'STABLE',
          notes: `Rounds completed by Dr. ${doctorUser.name}. Patient observed.`,
          treatmentPlan: 'Maintain hydration and observe protocol.',
          addenda: [],
        })
      );
    }
  }

  await TemperatureReading.insertMany(readingsToInsert);
  await DoctorVisit.insertMany(visitsToInsert);
  await DischargeRecord.insertMany(dischargesToInsert);

  // 7. Generate 50 Closed Cases (Section 8.3: 43 Discharged, 7 Deceased = 14.0% WARNING)
  const closedPatientsData = [];
  const deathRecordsToInsert = [];

  for (let j = 1; j <= 50; j++) {
    const isDeceased = j <= 7; // Exactly 7 deceased out of 50 closed cases = 14.0%
    const isFemale = j % 2 === 0;
    const name = getRandomName(100 + j, isFemale);
    const age = 22 + Math.floor(prng() * 60);
    const mrn = `QF-${String(200 + j).padStart(6, '0')}`;
    const phone = `+91 ${9600000000 + j}`;

    const daysClosedAgo = 1 + (j % 20);
    const stayLength = 5 + (j % 10);
    const admittedDaysAgo = daysClosedAgo + stayLength;

    const admittedOn = subDays(anchorDateStr, admittedDaysAgo);
    const closedOn = subDays(anchorDateStr, daysClosedAgo);
    const admittedAt = new Date(now.getTime() - admittedDaysAgo * 24 * 3600 * 1000);
    const closedAt = new Date(now.getTime() - daysClosedAgo * 24 * 3600 * 1000);

    const closedPatient = new Patient({
      mrn,
      name,
      age,
      sex: isFemale ? 'F' : 'M',
      phone,
      emergencyContact: {
        name: `Contact of ${name.split(' ')[0]}`,
        phone: `+91 ${9500000000 + j}`,
        relationship: 'Family',
      },
      admittedOn,
      admittedAt,
      admittedBy: nurseUser._id,
      roomId: null, // Closed cases have no room
      roomNumber: null,
      status: isDeceased ? 'DECEASED' : 'DISCHARGED',
      closedOn,
      closedAt,
      notes: isDeceased ? 'Case closed: Deceased.' : 'Case closed: Successfully discharged.',
    });

    closedPatientsData.push(closedPatient);

    if (isDeceased) {
      deathRecordsToInsert.push(
        new DeathRecord({
          patientId: closedPatient._id,
          occurredAt: closedAt,
          recordedAt: closedAt,
          recordedBy: doctorUser._id,
          recordedByName: doctorUser.name,
          causeNote: 'Severe respiratory distress with viral pneumonia.',
        })
      );
    }
  }

  await Patient.insertMany(closedPatientsData);
  await DeathRecord.insertMany(deathRecordsToInsert);

  // 8. Record Initial Demo Seed Audit Event
  await AuditEvent.create({
    at: now,
    actorId: directorUser._id,
    actorName: directorUser.name,
    actorRole: 'DIRECTOR',
    action: isReset ? 'DEMO_RESET' : 'DEMO_SEED',
    entity: 'Facility',
    summary: `Database seeded with 74 rooms, 74 active patients, 50 closed cases (14.0% mortality), and 9 demo personas.`,
    meta: {
      rooms: 74,
      activePatients: 74,
      closedCases: 50,
      initialMortality: '14.0%',
      alertState: 'WARNING',
    },
  });

  console.log(`[Seed] Seed completed successfully:`);
  console.log(` - 74 Rooms created (All occupied)`);
  console.log(` - 74 Active Patients created (38 temperatures done, 18 visits done)`);
  console.log(` - 50 Closed Cases created (43 Discharged, 7 Deceased = 14.0% WARNING)`);
  console.log(` - 9 Demo Users created across all 4 roles`);

  return {
    rooms: 74,
    activePatients: 74,
    closedCases: 50,
    discharged: 43,
    deceased: 7,
    mortalityRate: '14.0%',
    alertState: 'WARNING',
  };
}

// Allow direct CLI execution: node src/seed/seed.js
if (process.argv[1]?.endsWith('seed.js')) {
  connectDatabase()
    .then(() => seedDatabase(false))
    .then(() => {
      console.log('[Seed] Finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed] Error:', err);
      process.exit(1);
    });
}
