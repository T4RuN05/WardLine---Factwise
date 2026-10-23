import { Patient } from '../models/Patient.js';
import { TemperatureReading } from '../models/TemperatureReading.js';
import { DischargeRecord } from '../models/DischargeRecord.js';
import { withTransaction } from '../config/database.js';
import { getSettings } from './settingsService.js';
import { getToday, getNow } from './clock.js';
import { recordAuditEvent } from './auditService.js';
import { DomainError, ErrorCodes } from '../domain/errors.js';
import {
  validateTemperatureValue,
  classifyTemperature,
} from '../domain/temperature.js';
import { computeStreak } from '../domain/eligibility.js';

export async function recordTemperature(patientId, valueC, actor) {
  const settings = await getSettings();
  const today = getToday(settings);
  const now = getNow(settings);

  // 1. Patient check & TMP-8 closed guard
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new DomainError(ErrorCodes.NOT_FOUND, 'Patient not found.', 404);
  }
  if (patient.status === 'DISCHARGED' || patient.status === 'DECEASED') {
    throw new DomainError(
      ErrorCodes.PATIENT_CLOSED,
      `This patient is ${patient.status.toLowerCase()}. No further readings can be recorded.`,
      400
    );
  }

  // 2. Validate bounds (TMP-5)
  const validVal = validateTemperatureValue(valueC);
  const { isFever, isCritical } = classifyTemperature(validVal, settings);

  // 3. Duplicate check (TMP-2)
  const existingReading = await TemperatureReading.findOne({
    patientId: patient._id,
    date: today,
    isActive: true,
  }).populate('recordedBy', 'name');

  if (existingReading) {
    const recordedTime = new Date(existingReading.recordedAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    throw new DomainError(
      ErrorCodes.DUPLICATE_READING,
      `Temperature already recorded today: ${existingReading.valueC.toFixed(1)} °C at ${recordedTime} by ${existingReading.recordedBy?.name || 'Staff'}.`,
      409,
      {
        existingReading: {
          id: existingReading._id,
          valueC: existingReading.valueC,
          recordedAt: existingReading.recordedAt,
          recordedBy: existingReading.recordedBy?.name,
        },
      }
    );
  }

  return await withTransaction(async (session) => {
    const reading = new TemperatureReading({
      patientId: patient._id,
      date: today,
      recordedAt: now,
      valueC: validVal,
      recordedBy: actor._id,
      recordedByRole: actor.role,
      isFever,
      isCritical,
      isActive: true,
    });
    await reading.save({ session });

    let approvalRevoked = false;
    // TMP-10 / DIS-6: If patient is DISCHARGE_APPROVED and fever is recorded, auto-revoke approval!
    if (patient.status === 'DISCHARGE_APPROVED' && isFever) {
      patient.status = 'ADMITTED';
      await patient.save({ session });
      approvalRevoked = true;

      // Update open discharge record
      const openDischarge = await DischargeRecord.findOne({
        patientId: patient._id,
        completedAt: null,
      })
        .sort({ createdAt: -1 })
        .session(session);

      if (openDischarge) {
        openDischarge.revokedAt = now;
        openDischarge.revokedReason = `Fever reading of ${validVal.toFixed(1)} °C recorded.`;
        openDischarge.history.push({
          at: now,
          action: 'REVOKED_BY_FEVER',
          note: `Approval revoked due to fever reading ${validVal.toFixed(1)} °C.`,
        });
        await openDischarge.save({ session });
      }

      await recordAuditEvent(
        {
          actor,
          action: 'DISCHARGE_REVOKED_FEVER',
          entity: 'Patient',
          entityId: patient._id,
          patientId: patient._id,
          patientName: patient.name,
          summary: `Discharge approval for ${patient.name} was auto-revoked due to fever (${validVal.toFixed(1)} °C).`,
          meta: { temperature: validVal },
        },
        session
      );
    }

    // Check if new reading makes patient eligible (DIS-1, DIS-2)
    const allActiveReadings = await TemperatureReading.find({
      patientId: patient._id,
      isActive: true,
    }).session(session);

    const eligibility = computeStreak(allActiveReadings, today, settings);
    if (eligibility.eligible && patient.status === 'ADMITTED') {
      // Create or update discharge record for this eligibility cycle
      const existingCycle = await DischargeRecord.findOne({
        patientId: patient._id,
        eligibleOn: eligibility.eligibleOn,
      }).session(session);

      if (!existingCycle) {
        const dischargeRec = new DischargeRecord({
          patientId: patient._id,
          eligibleOn: eligibility.eligibleOn,
          history: [
            {
              at: now,
              action: 'BECAME_ELIGIBLE',
              note: `Eligible after 3 consecutive afebrile days ending ${eligibility.eligibleOn}.`,
            },
          ],
        });
        await dischargeRec.save({ session });
      }
    }

    // Audit temperature recorded
    await recordAuditEvent(
      {
        actor,
        action: 'TEMPERATURE_RECORDED',
        entity: 'TemperatureReading',
        entityId: reading._id,
        patientId: patient._id,
        patientName: patient.name,
        summary: `${actor.name} recorded ${validVal.toFixed(1)} °C for ${patient.name} in Room ${patient.roomNumber}.`,
        meta: { valueC: validVal, isFever, isCritical, date: today },
      },
      session
    );

    return { reading, eligibility, approvalRevoked };
  });
}

export async function correctTemperature(readingId, newValueC, reason, actor) {
  if (!reason || reason.trim().length < 5) {
    throw new DomainError(
      ErrorCodes.MISSING_REASON,
      'A reason with at least 5 characters is required to correct a reading.',
      400
    );
  }

  const settings = await getSettings();
  const today = getToday(settings);
  const now = getNow(settings);

  const oldReading = await TemperatureReading.findById(readingId);
  if (!oldReading || !oldReading.isActive) {
    throw new DomainError(ErrorCodes.NOT_FOUND, 'Active temperature reading not found.', 404);
  }

  // TMP-3: Nurse may correct today's reading only
  if (oldReading.date !== today) {
    throw new DomainError(
      ErrorCodes.INVALID_STATE,
      "Only today's reading can be corrected.",
      400
    );
  }

  const patient = await Patient.findById(oldReading.patientId);
  if (!patient || patient.status === 'DISCHARGED' || patient.status === 'DECEASED') {
    throw new DomainError(
      ErrorCodes.PATIENT_CLOSED,
      'Cannot correct readings for closed cases.',
      400
    );
  }

  const validVal = validateTemperatureValue(newValueC);
  const { isFever, isCritical } = classifyTemperature(validVal, settings);

  return await withTransaction(async (session) => {
    // 1. Create replacement active reading
    const replacement = new TemperatureReading({
      patientId: patient._id,
      date: today,
      recordedAt: now,
      valueC: validVal,
      recordedBy: actor._id,
      recordedByRole: actor.role,
      isFever,
      isCritical,
      isActive: true,
      correctionReason: reason.trim(),
    });
    await replacement.save({ session });

    // 2. Mark old reading superseded
    oldReading.isActive = false;
    oldReading.supersededBy = replacement._id;
    await oldReading.save({ session });

    // 3. Recompute eligibility (TMP-3, DIS-7)
    const activeReadings = await TemperatureReading.find({
      patientId: patient._id,
      isActive: true,
    }).session(session);

    const eligibility = computeStreak(activeReadings, today, settings);

    // If patient was DISCHARGE_APPROVED and correction makes them ineligible, auto-revoke! (DIS-7)
    let approvalRevoked = false;
    if (patient.status === 'DISCHARGE_APPROVED' && !eligibility.eligible) {
      patient.status = 'ADMITTED';
      await patient.save({ session });
      approvalRevoked = true;

      const openDischarge = await DischargeRecord.findOne({
        patientId: patient._id,
        completedAt: null,
      })
        .sort({ createdAt: -1 })
        .session(session);

      if (openDischarge) {
        openDischarge.revokedAt = now;
        openDischarge.revokedReason = `Correction from ${oldReading.valueC.toFixed(1)} to ${validVal.toFixed(1)} °C made patient ineligible.`;
        openDischarge.history.push({
          at: now,
          action: 'REVOKED_BY_CORRECTION',
          note: `Approval revoked due to temperature correction.`,
        });
        await openDischarge.save({ session });
      }
    }

    // Record audit event
    await recordAuditEvent(
      {
        actor,
        action: 'TEMPERATURE_CORRECTED',
        entity: 'TemperatureReading',
        entityId: replacement._id,
        patientId: patient._id,
        patientName: patient.name,
        summary: `${actor.name} corrected ${patient.name}'s temperature from ${oldReading.valueC.toFixed(1)} °C to ${validVal.toFixed(1)} °C: "${reason.trim()}"`,
        meta: {
          oldValue: oldReading.valueC,
          newValue: validVal,
          reason: reason.trim(),
          approvalRevoked,
        },
      },
      session
    );

    return { replacement, oldReading, eligibility, approvalRevoked };
  });
}

export async function doctorOverrideTemperature(patientId, valueC, reason, actor) {
  if (!reason || reason.trim().length < 5) {
    throw new DomainError(
      ErrorCodes.MISSING_REASON,
      'A reason with at least 5 characters is required for doctor temperature override.',
      400
    );
  }

  const settings = await getSettings();
  const today = getToday(settings);
  const now = getNow(settings);

  const patient = await Patient.findById(patientId);
  if (!patient || patient.status === 'DISCHARGED' || patient.status === 'DECEASED') {
    throw new DomainError(ErrorCodes.PATIENT_CLOSED, 'Patient is closed.', 400);
  }

  // Verify no active reading exists today (TMP-9)
  const existing = await TemperatureReading.findOne({
    patientId: patient._id,
    date: today,
    isActive: true,
  });

  if (existing) {
    throw new DomainError(
      ErrorCodes.DUPLICATE_READING,
      'Today already has an active reading. Use correction flow instead.',
      409
    );
  }

  const validVal = validateTemperatureValue(valueC);
  const { isFever, isCritical } = classifyTemperature(validVal, settings);

  return await withTransaction(async (session) => {
    const reading = new TemperatureReading({
      patientId: patient._id,
      date: today,
      recordedAt: now,
      valueC: validVal,
      recordedBy: actor._id,
      recordedByRole: 'DOCTOR',
      isFever,
      isCritical,
      isActive: true,
      correctionReason: `Doctor override: ${reason.trim()}`,
    });
    await reading.save({ session });

    await recordAuditEvent(
      {
        actor,
        action: 'DOCTOR_TEMPERATURE_OVERRIDE',
        entity: 'TemperatureReading',
        entityId: reading._id,
        patientId: patient._id,
        patientName: patient.name,
        summary: `Dr. ${actor.name} recorded temperature override (${validVal.toFixed(1)} °C) for ${patient.name}: "${reason.trim()}".`,
        meta: { valueC: validVal, reason: reason.trim() },
      },
      session
    );

    return { reading };
  });
}
