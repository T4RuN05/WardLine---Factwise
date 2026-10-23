import { Patient } from '../models/Patient.js';
import { Room } from '../models/Room.js';
import { TemperatureReading } from '../models/TemperatureReading.js';
import { DoctorVisit } from '../models/DoctorVisit.js';
import { DischargeRecord } from '../models/DischargeRecord.js';
import { AuditEvent } from '../models/AuditEvent.js';
import { getSettings } from './settingsService.js';
import { getToday, getNow } from './clock.js';
import { subDays, diffDays } from '../domain/dates.js';
import { getTaskStatus, sortDoctorRounds, TaskStatus } from '../domain/tasks.js';
import { computeStreak } from '../domain/eligibility.js';
import { DeathRecord } from '../models/DeathRecord.js';
import { computeMortality } from '../domain/metrics.js';

export async function getOverview() {
  const settings = await getSettings();
  const today = getToday(settings);

  // 1. Bed occupancy
  const totalRooms = settings.capacity;
  const occupiedRooms = await Room.countDocuments({ status: 'OCCUPIED' });
  const freeRooms = Math.max(0, totalRooms - occupiedRooms);

  // 2. Active patients
  const activePatients = await Patient.find({
    status: { $in: ['ADMITTED', 'DISCHARGE_APPROVED'] },
  }).select('_id roomNumber status');

  const patientIds = activePatients.map((p) => p._id);
  const totalActive = activePatients.length;

  // 3. Today's task completions
  const todayReadings = await TemperatureReading.find({
    patientId: { $in: patientIds },
    date: today,
    isActive: true,
  });
  const temperaturesDone = todayReadings.length;
  const temperaturesPending = Math.max(0, totalActive - temperaturesDone);

  const todayVisits = await DoctorVisit.find({
    patientId: { $in: patientIds },
    date: today,
  });
  const visitsDone = todayVisits.length;
  const visitsPending = Math.max(0, totalActive - visitsDone);

  // 4. Discharge queue counts
  const awaitingApprovalCount = await Patient.countDocuments({
    status: 'ADMITTED',
  }); // Refined below by eligibility
  const readyForCheckoutCount = await Patient.countDocuments({
    status: 'DISCHARGE_APPROVED',
  });

  // Calculate actual eligible awaiting approval
  const allActiveReadings = await TemperatureReading.find({
    patientId: { $in: patientIds },
    isActive: true,
  });
  const readingsByPatient = new Map();
  for (const r of allActiveReadings) {
    const pid = r.patientId.toString();
    if (!readingsByPatient.has(pid)) readingsByPatient.set(pid, []);
    readingsByPatient.get(pid).push(r);
  }

  let eligibleAwaitingApproval = 0;
  for (const p of activePatients) {
    if (p.status === 'ADMITTED') {
      const pReadings = readingsByPatient.get(p._id.toString()) || [];
      const elig = computeStreak(pReadings, today, settings);
      if (elig.eligible) eligibleAwaitingApproval += 1;
    }
  }

  // 5. Mortality metrics
  const closedCases = await Patient.find({
    status: { $in: ['DISCHARGED', 'DECEASED'] },
  });
  const mortality = computeMortality(closedCases, settings);

  return {
    facilityName: settings.facilityName,
    today,
    simulatedClock: !!settings.demoClockNow,
    simulatedDate: settings.demoClockNow,
    rooms: {
      total: totalRooms,
      occupied: occupiedRooms,
      free: freeRooms,
    },
    tasks: {
      temperatures: {
        done: temperaturesDone,
        pending: temperaturesPending,
        total: totalActive,
      },
      visits: {
        done: visitsDone,
        pending: visitsPending,
        total: totalActive,
      },
    },
    discharges: {
      awaitingApproval: eligibleAwaitingApproval,
      readyForCheckout: readyForCheckoutCount,
    },
    mortality,
  };
}

export async function getNurseWorklist(ward = 'ALL') {
  const settings = await getSettings();
  const today = getToday(settings);
  const yesterday = subDays(today, 1);

  // Load active patients
  const query = { status: { $in: ['ADMITTED', 'DISCHARGE_APPROVED'] } };
  const patients = await Patient.find(query)
    .populate('roomId')
    .sort({ roomNumber: 1 });

  const patientIds = patients.map((p) => p._id);

  // Load today's active readings
  const todayReadings = await TemperatureReading.find({
    patientId: { $in: patientIds },
    date: today,
    isActive: true,
  }).populate('recordedBy', 'name');

  const todayReadingsMap = new Map(
    todayReadings.map((r) => [r.patientId.toString(), r])
  );

  // Load yesterday's readings for reference
  const yesterdayReadings = await TemperatureReading.find({
    patientId: { $in: patientIds },
    date: yesterday,
    isActive: true,
  });
  const yesterdayMap = new Map(
    yesterdayReadings.map((r) => [r.patientId.toString(), r])
  );

  const pending = [];
  const done = [];

  for (const patient of patients) {
    if (ward !== 'ALL' && patient.roomId?.ward !== ward) {
      continue;
    }

    const todayReading = todayReadingsMap.get(patient._id.toString());
    const yesterdayReading = yesterdayMap.get(patient._id.toString());

    const item = {
      id: patient._id,
      patientId: patient._id,
      mrn: patient.mrn,
      name: patient.name,
      age: patient.age,
      sex: patient.sex,
      roomNumber: patient.roomNumber,
      ward: patient.roomId?.ward || 'A',
      status: patient.status,
      yesterdayReading: yesterdayReading
        ? {
            valueC: yesterdayReading.valueC,
            isFever: yesterdayReading.isFever,
          }
        : null,
      todayReading: todayReading
        ? {
            id: todayReading._id,
            valueC: todayReading.valueC,
            isFever: todayReading.isFever,
            isCritical: todayReading.isCritical,
            recordedAt: todayReading.recordedAt,
            recordedByName: todayReading.recordedBy?.name || 'Staff',
            recordedByRole: todayReading.recordedByRole,
            correctionReason: todayReading.correctionReason,
          }
        : null,
    };

    if (todayReading) {
      done.push(item);
    } else {
      pending.push(item);
    }
  }

  // Count total fever readings today
  const feverCount = done.filter((d) => d.todayReading?.isFever).length;

  return {
    today,
    total: patients.length,
    counts: {
      pending: pending.length,
      done: done.length,
      fever: feverCount,
    },
    pending,
    done,
  };
}

export async function getDoctorRounds(filter = 'ALL') {
  const settings = await getSettings();
  const today = getToday(settings);
  const now = getNow(settings);

  const patients = await Patient.find({
    status: { $in: ['ADMITTED', 'DISCHARGE_APPROVED'] },
  })
    .populate('roomId')
    .sort({ roomNumber: 1 });

  const patientIds = patients.map((p) => p._id);

  // Load today's readings, visits, and full active readings for streaks
  const [todayReadings, todayVisits, allActiveReadings] = await Promise.all([
    TemperatureReading.find({
      patientId: { $in: patientIds },
      date: today,
      isActive: true,
    }).populate('recordedBy', 'name'),
    DoctorVisit.find({
      patientId: { $in: patientIds },
      date: today,
    }).populate('doctorId', 'name'),
    TemperatureReading.find({
      patientId: { $in: patientIds },
      isActive: true,
    }),
  ]);

  const todayReadingsMap = new Map(
    todayReadings.map((r) => [r.patientId.toString(), r])
  );
  const todayVisitsMap = new Map(
    todayVisits.map((v) => [v.patientId.toString(), v])
  );

  const readingsByPatient = new Map();
  for (const r of allActiveReadings) {
    const pid = r.patientId.toString();
    if (!readingsByPatient.has(pid)) readingsByPatient.set(pid, []);
    readingsByPatient.get(pid).push(r);
  }

  const items = patients.map((patient) => {
    const pid = patient._id.toString();
    const reading = todayReadingsMap.get(pid);
    const visit = todayVisitsMap.get(pid);
    const taskStatus = getTaskStatus(patient, reading, visit);

    const pReadings = readingsByPatient.get(pid) || [];
    const eligibility = computeStreak(pReadings, today, settings);

    return {
      id: patient._id,
      patientId: patient._id,
      mrn: patient.mrn,
      name: patient.name,
      age: patient.age,
      sex: patient.sex,
      roomNumber: patient.roomNumber,
      ward: patient.roomId?.ward || 'A',
      status: patient.status,
      taskStatus,
      todayReading: reading
        ? {
            id: reading._id,
            valueC: reading.valueC,
            isFever: reading.isFever,
            isCritical: reading.isCritical,
            recordedAt: reading.recordedAt,
            recordedByName: reading.recordedBy?.name,
          }
        : null,
      todayVisit: visit
        ? {
            id: visit._id,
            clinicalStatus: visit.clinicalStatus,
            visitedAt: visit.visitedAt,
            doctorName: visit.doctorId?.name,
          }
        : null,
      eligibility,
    };
  });

  // Sort doctor rounds per TSK-2 rules
  const sortedItems = sortDoctorRounds(items);

  // Filter if needed
  let filteredItems = sortedItems;
  if (filter === 'READY') {
    filteredItems = sortedItems.filter(
      (i) => i.taskStatus === TaskStatus.READY_FOR_DOCTOR
    );
  } else if (filter === 'AWAITING') {
    filteredItems = sortedItems.filter(
      (i) => i.taskStatus === TaskStatus.NEEDS_TEMPERATURE
    );
  } else if (filter === 'DONE') {
    filteredItems = sortedItems.filter(
      (i) => i.taskStatus === TaskStatus.COMPLETE
    );
  } else if (filter === 'FEVER') {
    filteredItems = sortedItems.filter((i) => i.todayReading?.isFever);
  } else if (filter === 'ELIGIBLE') {
    filteredItems = sortedItems.filter((i) => i.eligibility?.eligible);
  }

  const counts = {
    total: sortedItems.length,
    ready: sortedItems.filter((i) => i.taskStatus === TaskStatus.READY_FOR_DOCTOR)
      .length,
    awaiting: sortedItems.filter(
      (i) => i.taskStatus === TaskStatus.NEEDS_TEMPERATURE
    ).length,
    done: sortedItems.filter((i) => i.taskStatus === TaskStatus.COMPLETE).length,
    fever: sortedItems.filter((i) => i.todayReading?.isFever).length,
    eligible: sortedItems.filter((i) => i.eligibility?.eligible).length,
  };

  return {
    today,
    counts,
    items: filteredItems,
  };
}

export async function getBedMap() {
  const settings = await getSettings();
  const today = getToday(settings);
  const now = getNow(settings);

  // Fetch all 74 rooms
  const rooms = await Room.find()
    .populate('patientId')
    .sort({ number: 1 });

  const occupiedRooms = rooms.filter((r) => r.status === 'OCCUPIED' && r.patientId);
  const patientIds = occupiedRooms.map((r) => r.patientId._id);

  // Fetch today's readings and all active readings for streak
  const [todayReadings, allActiveReadings, openDischarges] = await Promise.all([
    TemperatureReading.find({
      patientId: { $in: patientIds },
      date: today,
      isActive: true,
    }),
    TemperatureReading.find({
      patientId: { $in: patientIds },
      isActive: true,
    }),
    DischargeRecord.find({
      patientId: { $in: patientIds },
      completedAt: null,
    }),
  ]);

  const todayReadingMap = new Map(
    todayReadings.map((r) => [r.patientId.toString(), r])
  );
  const readingsByPatient = new Map();
  for (const r of allActiveReadings) {
    const pid = r.patientId.toString();
    if (!readingsByPatient.has(pid)) readingsByPatient.set(pid, []);
    readingsByPatient.get(pid).push(r);
  }

  const dischargeMap = new Map(
    openDischarges.map((d) => [d.patientId.toString(), d])
  );

  const tiles = rooms.map((room) => {
    if (room.status === 'AVAILABLE' || !room.patientId) {
      return {
        id: room._id,
        number: room.number,
        ward: room.ward,
        status: 'AVAILABLE',
        patient: null,
      };
    }

    const patient = room.patientId;
    const pid = patient._id.toString();
    const todayReading = todayReadingMap.get(pid);
    const pReadings = readingsByPatient.get(pid) || [];
    const eligibility = computeStreak(pReadings, today, settings);
    const discharge = dischargeMap.get(pid);

    // Aging flags (DIS-5)
    let isOverdueApproval = false;
    let isOverdueCheckout = false;
    let overdueHours = 0;

    if (eligibility.eligible && patient.status === 'ADMITTED') {
      // Eligible since yesterday or earlier, not approved
      if (eligibility.eligibleOn && eligibility.eligibleOn < today) {
        isOverdueApproval = true;
      }
    } else if (patient.status === 'DISCHARGE_APPROVED' && discharge?.approvedAt) {
      const diffHours =
        (now.getTime() - new Date(discharge.approvedAt).getTime()) /
        (1000 * 60 * 60);
      if (diffHours > settings.approvedNotDischargedSlaHours) {
        isOverdueCheckout = true;
        overdueHours = Math.round(diffHours - settings.approvedNotDischargedSlaHours);
      }
    }

    return {
      id: room._id,
      number: room.number,
      ward: room.ward,
      status: 'OCCUPIED',
      patient: {
        id: patient._id,
        mrn: patient.mrn,
        name: patient.name,
        age: patient.age,
        sex: patient.sex,
        admittedOn: patient.admittedOn,
        status: patient.status,
      },
      todayReading: todayReading
        ? {
            valueC: todayReading.valueC,
            isFever: todayReading.isFever,
            isCritical: todayReading.isCritical,
          }
        : null,
      eligibility,
      isApproved: patient.status === 'DISCHARGE_APPROVED',
      isOverdueApproval,
      isOverdueCheckout,
      overdueHours,
    };
  });

  const total = tiles.length;
  const free = tiles.filter((t) => t.status === 'AVAILABLE').length;
  const occupied = total - free;
  const eligible = tiles.filter((t) => t.eligibility?.eligible && !t.isApproved).length;
  const approved = tiles.filter((t) => t.isApproved).length;

  return {
    today,
    counts: { total, occupied, free, eligible, approved },
    tiles,
  };
}

export async function getDischargeQueue() {
  const settings = await getSettings();
  const today = getToday(settings);
  const now = getNow(settings);

  // 1. Ready for checkout (approved by doctor)
  const approvedPatients = await Patient.find({
    status: 'DISCHARGE_APPROVED',
  }).populate('roomId');

  const approvedIds = approvedPatients.map((p) => p._id);
  const dischargeRecords = await DischargeRecord.find({
    patientId: { $in: approvedIds },
    completedAt: null,
  }).populate('approvedBy', 'name');

  const recordMap = new Map(
    dischargeRecords.map((r) => [r.patientId.toString(), r])
  );

  const readyForCheckout = approvedPatients.map((patient) => {
    const record = recordMap.get(patient._id.toString());
    const approvedAt = record?.approvedAt ? new Date(record.approvedAt) : null;
    let waitingHours = 0;
    let isOverdue = false;

    if (approvedAt) {
      waitingHours = Math.round(
        (now.getTime() - approvedAt.getTime()) / (1000 * 60 * 60)
      );
      isOverdue = waitingHours > settings.approvedNotDischargedSlaHours;
    }

    return {
      id: patient._id,
      patientId: patient._id,
      mrn: patient.mrn,
      name: patient.name,
      age: patient.age,
      sex: patient.sex,
      roomNumber: patient.roomNumber,
      ward: patient.roomId?.ward || 'A',
      approvedAt,
      approvedByName: record?.approvedBy?.name || record?.approvedByName || 'Doctor',
      waitingHours,
      slaHours: settings.approvedNotDischargedSlaHours,
      isOverdue,
    };
  });

  // 2. Awaiting doctor approval (status ADMITTED, streak >= requiredFeverFreeDays)
  const admittedPatients = await Patient.find({
    status: 'ADMITTED',
  }).populate('roomId');

  const admittedIds = admittedPatients.map((p) => p._id);
  const allReadings = await TemperatureReading.find({
    patientId: { $in: admittedIds },
    isActive: true,
  });

  const readingsMap = new Map();
  for (const r of allReadings) {
    const pid = r.patientId.toString();
    if (!readingsMap.has(pid)) readingsMap.set(pid, []);
    readingsMap.get(pid).push(r);
  }

  const awaitingApproval = [];
  for (const patient of admittedPatients) {
    const pReadings = readingsMap.get(patient._id.toString()) || [];
    const elig = computeStreak(pReadings, today, settings);

    if (elig.eligible) {
      const isOverdue = elig.eligibleOn && elig.eligibleOn < today;
      awaitingApproval.push({
        id: patient._id,
        patientId: patient._id,
        mrn: patient.mrn,
        name: patient.name,
        age: patient.age,
        sex: patient.sex,
        roomNumber: patient.roomNumber,
        ward: patient.roomId?.ward || 'A',
        eligibleOn: elig.eligibleOn,
        streakLength: elig.length,
        days: elig.days,
        isOverdue,
      });
    }
  }

  return {
    counts: {
      awaitingApproval: awaitingApproval.length,
      readyForCheckout: readyForCheckout.length,
    },
    awaitingApproval,
    readyForCheckout,
  };
}

export async function getPatientsList(query = {}) {
  const { search, ward, status, page = 1, limit = 100 } = query;
  const filter = {};

  if (status) {
    filter.status = status;
  }
  if (search) {
    const term = search.trim();
    filter.$or = [
      { name: new RegExp(term, 'i') },
      { mrn: new RegExp(term, 'i') },
      { phone: new RegExp(term, 'i') },
    ];
    if (!isNaN(term)) {
      filter.$or.push({ roomNumber: Number(term) });
    }
  }

  const patients = await Patient.find(filter)
    .populate('roomId')
    .sort({ roomNumber: 1, admittedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Patient.countDocuments(filter);

  return { total, page, limit, patients };
}

export async function getPatientProfile(patientId) {
  const settings = await getSettings();
  const today = getToday(settings);

  const patient = await Patient.findById(patientId)
    .populate('roomId')
    .populate('admittedBy', 'name role');

  if (!patient) return null;

  // Fetch readings (chronological), visits, discharge records, and death record
  const [readings, visits, discharges, death] = await Promise.all([
    TemperatureReading.find({ patientId: patient._id })
      .populate('recordedBy', 'name role')
      .sort({ recordedAt: -1 }),
    DoctorVisit.find({ patientId: patient._id })
      .populate('doctorId', 'name')
      .sort({ visitedAt: -1 }),
    DischargeRecord.find({ patientId: patient._id })
      .populate('approvedBy', 'name')
      .populate('completedBy', 'name')
      .sort({ createdAt: -1 }),
    patient.status === 'DECEASED'
      ? DeathRecord.findOne({ patientId: patient._id }).populate('recordedBy', 'name')
      : null,
  ]);

  const activeReadings = readings.filter((r) => r.isActive);
  const eligibility = computeStreak(activeReadings, today, settings);

  // Patient audit events
  const auditEvents = await AuditEvent.find({ patientId: patient._id })
    .sort({ at: -1 })
    .limit(30);

  return {
    patient,
    eligibility,
    readings,
    visits,
    discharges,
    death,
    auditEvents,
  };
}

export async function getDirectorAnalytics(window = 'ALL') {
  const settings = await getSettings();
  const today = getToday(settings);

  // 1. Closed cases for mortality
  let closedQuery = { status: { $in: ['DISCHARGED', 'DECEASED'] } };

  if (window === '7D') {
    const cutoff = subDays(today, 7);
    closedQuery.closedOn = { $gte: cutoff };
  } else if (window === '30D') {
    const cutoff = subDays(today, 30);
    closedQuery.closedOn = { $gte: cutoff };
  }

  const closedCases = await Patient.find(closedQuery);
  const mortality = computeMortality(closedCases, settings);

  // 2. Average Length of Stay (LOS) for closed cases
  let totalLosDays = 0;
  for (const c of closedCases) {
    if (c.admittedOn && c.closedOn) {
      const stay = Math.max(1, diffDays(c.closedOn, c.admittedOn));
      totalLosDays += stay;
    }
  }
  const averageLos =
    closedCases.length > 0
      ? Math.round((totalLosDays / closedCases.length) * 10) / 10
      : 0;

  // 3. Operational compliance today
  const activePatients = await Patient.find({
    status: { $in: ['ADMITTED', 'DISCHARGE_APPROVED'] },
  });
  const activeIds = activePatients.map((p) => p._id);

  const [todayReadings, todayVisits, doctorOverrideReadings] = await Promise.all([
    TemperatureReading.countDocuments({
      patientId: { $in: activeIds },
      date: today,
      isActive: true,
    }),
    DoctorVisit.countDocuments({
      patientId: { $in: activeIds },
      date: today,
    }),
    TemperatureReading.countDocuments({
      patientId: { $in: activeIds },
      date: today,
      recordedByRole: 'DOCTOR',
    }),
  ]);

  // 4. Current bed occupancy
  const occupiedCount = await Room.countDocuments({ status: 'OCCUPIED' });

  // 5. Weekly trend data for Recharts (P0/P1)
  // Group closed cases by week
  const trendMap = new Map();
  for (const c of closedCases) {
    const dateKey = c.closedOn || today;
    if (!trendMap.has(dateKey)) {
      trendMap.set(dateKey, { date: dateKey, discharged: 0, deceased: 0 });
    }
    const entry = trendMap.get(dateKey);
    if (c.status === 'DECEASED') entry.deceased += 1;
    else entry.discharged += 1;
  }
  const trend = [...trendMap.values()].sort((a, b) => a.date.localeCompare(b.date));

  return {
    today,
    window,
    mortality,
    operational: {
      capacity: settings.capacity,
      occupied: occupiedCount,
      occupancyPercent: Math.round((occupiedCount / settings.capacity) * 100),
      activePatientsCount: activePatients.length,
      temperaturesDone: todayReadings,
      temperatureCompliancePercent:
        activePatients.length > 0
          ? Math.round((todayReadings / activePatients.length) * 100)
          : 0,
      visitsDone: todayVisits,
      visitCompliancePercent:
        activePatients.length > 0
          ? Math.round((todayVisits / activePatients.length) * 100)
          : 0,
      doctorRecordedTemperatures: doctorOverrideReadings,
      averageLengthOfStayDays: averageLos,
    },
    trend,
  };
}

export async function getAuditLog(query = {}) {
  const { role, action, search, page = 1, limit = 50 } = query;
  const filter = {};

  if (role) filter.actorRole = role;
  if (action) filter.action = action;
  if (search) {
    filter.$or = [
      { patientName: new RegExp(search.trim(), 'i') },
      { summary: new RegExp(search.trim(), 'i') },
      { actorName: new RegExp(search.trim(), 'i') },
    ];
  }

  const events = await AuditEvent.find(filter)
    .sort({ at: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await AuditEvent.countDocuments(filter);

  return { total, page, limit, events };
}
