import { Patient } from '../models/Patient.js';
import { Room } from '../models/Room.js';
import { TemperatureReading } from '../models/TemperatureReading.js';
import { DischargeRecord } from '../models/DischargeRecord.js';
import { withTransaction } from '../config/database.js';
import { getSettings } from './settingsService.js';
import { getToday, getNow } from './clock.js';
import { recordAuditEvent } from './auditService.js';
import { DomainError, ErrorCodes } from '../domain/errors.js';
import { computeStreak } from '../domain/eligibility.js';

export async function approveDischarge(patientId, actor) {
  const settings = await getSettings();
  const today = getToday(settings);
  const now = getNow(settings);

  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new DomainError(ErrorCodes.NOT_FOUND, 'Patient not found.', 404);
  }
  if (patient.status === 'DISCHARGED' || patient.status === 'DECEASED') {
    throw new DomainError(ErrorCodes.PATIENT_CLOSED, 'Patient is closed.', 400);
  }
  if (patient.status === 'DISCHARGE_APPROVED') {
    throw new DomainError(
      ErrorCodes.INVALID_STATE,
      'Discharge has already been approved for this patient.',
      400
    );
  }

  // DIS-3: Doctor cannot approve a patient who is not eligible based on consecutive afebrile days
  const activeReadings = await TemperatureReading.find({
    patientId: patient._id,
    isActive: true,
  });

  const eligibility = computeStreak(activeReadings, today, settings);
  if (!eligibility.eligible) {
    throw new DomainError(
      ErrorCodes.DISCHARGE_NOT_ELIGIBLE,
      `Needs ${settings.requiredFeverFreeDays} consecutive fever-free days. Current streak: ${eligibility.length} of ${settings.requiredFeverFreeDays}.`,
      400,
      { streak: eligibility.length, required: settings.requiredFeverFreeDays }
    );
  }

  return await withTransaction(async (session) => {
    patient.status = 'DISCHARGE_APPROVED';
    await patient.save({ session });

    // Update or create discharge record
    let dischargeRec = await DischargeRecord.findOne({
      patientId: patient._id,
      completedAt: null,
    })
      .sort({ createdAt: -1 })
      .session(session);

    if (!dischargeRec) {
      dischargeRec = new DischargeRecord({
        patientId: patient._id,
        eligibleOn: eligibility.eligibleOn || today,
        history: [],
      });
    }

    dischargeRec.approvedAt = now;
    dischargeRec.approvedBy = actor._id;
    dischargeRec.approvedByName = actor.name;
    dischargeRec.revokedAt = null;
    dischargeRec.revokedReason = null;
    dischargeRec.history.push({
      at: now,
      action: 'APPROVED_BY_DOCTOR',
      actorId: actor._id,
      actorName: actor.name,
      note: `Approved by Dr. ${actor.name} based on ${eligibility.length} consecutive fever-free days.`,
    });

    await dischargeRec.save({ session });

    await recordAuditEvent(
      {
        actor,
        action: 'DISCHARGE_APPROVED',
        entity: 'Patient',
        entityId: patient._id,
        patientId: patient._id,
        patientName: patient.name,
        summary: `Dr. ${actor.name} approved discharge for ${patient.name} (Room ${patient.roomNumber}).`,
        meta: { eligibleOn: eligibility.eligibleOn, streak: eligibility.length },
      },
      session
    );

    return { patient, dischargeRecord: dischargeRec, eligibility };
  });
}

export async function revokeDischarge(patientId, reason, actor) {
  if (!reason || reason.trim().length < 5) {
    throw new DomainError(
      ErrorCodes.MISSING_REASON,
      'A reason with at least 5 characters is required to revoke discharge approval.',
      400
    );
  }

  const now = new Date();
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new DomainError(ErrorCodes.NOT_FOUND, 'Patient not found.', 404);
  }
  if (patient.status !== 'DISCHARGE_APPROVED') {
    throw new DomainError(
      ErrorCodes.INVALID_STATE,
      'Patient does not have an active discharge approval to revoke.',
      400
    );
  }

  return await withTransaction(async (session) => {
    patient.status = 'ADMITTED';
    await patient.save({ session });

    const dischargeRec = await DischargeRecord.findOne({
      patientId: patient._id,
      completedAt: null,
    })
      .sort({ createdAt: -1 })
      .session(session);

    if (dischargeRec) {
      dischargeRec.revokedAt = now;
      dischargeRec.revokedReason = reason.trim();
      dischargeRec.revokedBy = actor._id;
      dischargeRec.history.push({
        at: now,
        action: 'REVOKED_BY_DOCTOR',
        actorId: actor._id,
        actorName: actor.name,
        note: reason.trim(),
      });
      await dischargeRec.save({ session });
    }

    await recordAuditEvent(
      {
        actor,
        action: 'DISCHARGE_REVOKED',
        entity: 'Patient',
        entityId: patient._id,
        patientId: patient._id,
        patientName: patient.name,
        summary: `Dr. ${actor.name} revoked discharge approval for ${patient.name}: "${reason.trim()}"`,
        meta: { reason: reason.trim() },
      },
      session
    );

    return { patient, dischargeRecord: dischargeRec };
  });
}

export async function completeDischarge(patientId, actor) {
  const settings = await getSettings();
  const today = getToday(settings);
  const now = getNow(settings);

  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new DomainError(ErrorCodes.NOT_FOUND, 'Patient not found.', 404);
  }

  // DIS-4: Admin may complete checkout only for patients with active approval
  if (settings.requireDoctorApproval && patient.status !== 'DISCHARGE_APPROVED') {
    throw new DomainError(
      ErrorCodes.DISCHARGE_NOT_APPROVED,
      'Patient must have doctor approval before checkout can be completed.',
      400
    );
  }

  return await withTransaction(async (session) => {
    // 1. Close patient record
    patient.status = 'DISCHARGED';
    patient.closedOn = today;
    patient.closedAt = now;
    const assignedRoomId = patient.roomId;
    const roomNumber = patient.roomNumber;
    patient.roomId = null;
    await patient.save({ session });

    // 2. Free the room (ADM-7)
    let freedRoom = null;
    if (assignedRoomId) {
      freedRoom = await Room.findById(assignedRoomId).session(session);
      if (freedRoom) {
        freedRoom.status = 'AVAILABLE';
        freedRoom.patientId = null;
        await freedRoom.save({ session });
      }
    }

    // 3. Complete discharge record
    const dischargeRec = await DischargeRecord.findOne({
      patientId: patient._id,
      completedAt: null,
    })
      .sort({ createdAt: -1 })
      .session(session);

    if (dischargeRec) {
      dischargeRec.completedAt = now;
      dischargeRec.completedBy = actor._id;
      dischargeRec.completedByName = actor.name;
      dischargeRec.history.push({
        at: now,
        action: 'CHECKOUT_COMPLETED',
        actorId: actor._id,
        actorName: actor.name,
        note: `Discharge checkout completed by ${actor.name}. Room ${roomNumber} marked free.`,
      });
      await dischargeRec.save({ session });
    }

    // 4. Audit checkout
    await recordAuditEvent(
      {
        actor,
        action: 'DISCHARGE_COMPLETED',
        entity: 'Patient',
        entityId: patient._id,
        patientId: patient._id,
        patientName: patient.name,
        summary: `${actor.name} completed discharge for ${patient.name}. Room ${roomNumber} is now free.`,
        meta: { roomNumber, closedOn: today },
      },
      session
    );

    return { patient, freedRoom, dischargeRecord: dischargeRec };
  });
}
