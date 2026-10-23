import { Patient } from '../models/Patient.js';
import { DoctorVisit } from '../models/DoctorVisit.js';
import { TemperatureReading } from '../models/TemperatureReading.js';
import { withTransaction } from '../config/database.js';
import { getSettings } from './settingsService.js';
import { getToday, getNow } from './clock.js';
import { recordAuditEvent } from './auditService.js';
import { DomainError, ErrorCodes } from '../domain/errors.js';

export async function logDoctorVisit(patientId, data, actor) {
  const settings = await getSettings();
  const today = getToday(settings);
  const now = getNow(settings);

  // 1. Patient check (VIS-7)
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new DomainError(ErrorCodes.NOT_FOUND, 'Patient not found.', 404);
  }
  if (patient.status === 'DISCHARGED' || patient.status === 'DECEASED') {
    throw new DomainError(
      ErrorCodes.PATIENT_CLOSED,
      `This patient is ${patient.status.toLowerCase()}. Visits cannot be logged for closed cases.`,
      400
    );
  }

  // 2. Reading prerequisite (VIS-2)
  const todayReading = await TemperatureReading.findOne({
    patientId: patient._id,
    date: today,
    isActive: true,
  });

  if (!todayReading) {
    throw new DomainError(
      ErrorCodes.VISIT_MISSING_READING,
      "Today's temperature is missing. Ask nursing to record it first.",
      400
    );
  }

  // Ensure visit time is after reading time (TSK-6)
  if (now.getTime() < new Date(todayReading.recordedAt).getTime()) {
    throw new DomainError(
      ErrorCodes.VISIT_BEFORE_READING,
      'Visit timestamp cannot precede the recorded temperature reading time.',
      400
    );
  }

  // 3. Prevent duplicate primary visit (VIS-3)
  const existingVisit = await DoctorVisit.findOne({
    patientId: patient._id,
    date: today,
  });

  if (existingVisit) {
    throw new DomainError(
      ErrorCodes.DUPLICATE_VISIT,
      'A primary visit has already been logged for this patient today. Use the addendum flow to append notes.',
      409,
      { existingVisitId: existingVisit._id }
    );
  }

  // 4. Validate fields (VIS-4)
  if (!data.clinicalStatus) {
    throw new DomainError(ErrorCodes.INVALID_STATE, 'Clinical status is required.', 400);
  }
  if (!data.notes || !data.notes.trim()) {
    throw new DomainError(ErrorCodes.INVALID_STATE, 'Clinical visit notes are required.', 400);
  }

  return await withTransaction(async (session) => {
    const visit = new DoctorVisit({
      patientId: patient._id,
      date: today,
      visitedAt: now,
      doctorId: actor._id,
      temperatureReadingId: todayReading._id,
      clinicalStatus: data.clinicalStatus,
      notes: data.notes.trim(),
      treatmentPlan: (data.treatmentPlan || '').trim(),
      addenda: [],
    });

    await visit.save({ session });

    await recordAuditEvent(
      {
        actor,
        action: 'DOCTOR_VISIT_LOGGED',
        entity: 'DoctorVisit',
        entityId: visit._id,
        patientId: patient._id,
        patientName: patient.name,
        summary: `Dr. ${actor.name} logged daily visit for ${patient.name} (Status: ${data.clinicalStatus}).`,
        meta: { clinicalStatus: data.clinicalStatus, readingId: todayReading._id },
      },
      session
    );

    return { visit };
  });
}

export async function addVisitAddendum(visitId, text, actor) {
  if (!text || !text.trim()) {
    throw new DomainError(ErrorCodes.INVALID_STATE, 'Addendum text is required.', 400);
  }

  const visit = await DoctorVisit.findById(visitId);
  if (!visit) {
    throw new DomainError(ErrorCodes.NOT_FOUND, 'Visit record not found.', 404);
  }

  const patient = await Patient.findById(visit.patientId);
  if (!patient || patient.status === 'DISCHARGED' || patient.status === 'DECEASED') {
    throw new DomainError(ErrorCodes.PATIENT_CLOSED, 'Patient is closed.', 400);
  }

  const now = new Date();
  const addendum = {
    at: now,
    doctorId: actor._id,
    doctorName: actor.name,
    text: text.trim(),
  };

  visit.addenda.push(addendum);
  await visit.save();

  await recordAuditEvent({
    actor,
    action: 'VISIT_ADDENDUM_ADDED',
    entity: 'DoctorVisit',
    entityId: visit._id,
    patientId: patient._id,
    patientName: patient.name,
    summary: `Dr. ${actor.name} added an addendum to the visit for ${patient.name}.`,
    meta: { visitId: visit._id },
  });

  return { visit, addendum };
}
