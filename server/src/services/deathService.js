import { Patient } from '../models/Patient.js';
import { Room } from '../models/Room.js';
import { DeathRecord } from '../models/DeathRecord.js';
import { DischargeRecord } from '../models/DischargeRecord.js';
import { withTransaction } from '../config/database.js';
import { getSettings } from './settingsService.js';
import { getToday, getNow } from './clock.js';
import { recordAuditEvent } from './auditService.js';
import { DomainError, ErrorCodes } from '../domain/errors.js';
import { computeMortality, AlertState } from '../domain/metrics.js';

export async function recordDeath(patientId, data, actor) {
  const settings = await getSettings();
  const today = getToday(settings);
  const now = getNow(settings);

  // 1. Patient check (DEC-1)
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new DomainError(ErrorCodes.NOT_FOUND, 'Patient not found.', 404);
  }
  if (patient.status === 'DECEASED') {
    throw new DomainError(ErrorCodes.INVALID_STATE, 'Death already recorded for this patient.', 400);
  }
  if (patient.status === 'DISCHARGED') {
    throw new DomainError(ErrorCodes.INVALID_STATE, 'Cannot record death for an already discharged patient.', 400);
  }

  // 2. Room confirmation check (DEC-2)
  if (Number(data.confirmRoomNumber) !== Number(patient.roomNumber)) {
    throw new DomainError(
      ErrorCodes.INVALID_STATE,
      `Confirmation failed. Please enter the exact room number (${patient.roomNumber}) to confirm.`,
      400
    );
  }

  // 3. Cause note required (DEC-1)
  if (!data.causeNote || !data.causeNote.trim()) {
    throw new DomainError(ErrorCodes.INVALID_STATE, 'A cause of death note is required.', 400);
  }

  const occurredAt = data.occurredAt ? new Date(data.occurredAt) : now;
  if (occurredAt.getTime() > now.getTime()) {
    throw new DomainError(ErrorCodes.INVALID_STATE, 'Time of death cannot be in the future.', 400);
  }

  return await withTransaction(async (session) => {
    // 1. Create death record
    const deathRecord = new DeathRecord({
      patientId: patient._id,
      occurredAt,
      recordedAt: now,
      recordedBy: actor._id,
      recordedByName: actor.name,
      causeNote: data.causeNote.trim(),
    });
    await deathRecord.save({ session });

    // 2. Close patient and unassign room
    const assignedRoomId = patient.roomId;
    const roomNumber = patient.roomNumber;
    patient.status = 'DECEASED';
    patient.closedOn = today;
    patient.closedAt = now;
    patient.roomId = null;
    await patient.save({ session });

    // 3. Free the room (ADM-7)
    let freedRoom = null;
    if (assignedRoomId) {
      freedRoom = await Room.findById(assignedRoomId).session(session);
      if (freedRoom) {
        freedRoom.status = 'AVAILABLE';
        freedRoom.patientId = null;
        await freedRoom.save({ session });
      }
    }

    // 4. Close any open discharge records
    await DischargeRecord.updateMany(
      { patientId: patient._id, completedAt: null },
      {
        $set: {
          revokedAt: now,
          revokedReason: 'Patient deceased.',
        },
      },
      { session }
    );

    // 5. Evaluate mortality alert (MET-6)
    const closedCases = await Patient.find({
      status: { $in: ['DISCHARGED', 'DECEASED'] },
    }).session(session);

    const metrics = computeMortality(closedCases, settings);

    // 6. Record audit event for death
    await recordAuditEvent(
      {
        actor,
        action: 'PATIENT_DECEASED',
        entity: 'Patient',
        entityId: patient._id,
        patientId: patient._id,
        patientName: patient.name,
        summary: `Dr. ${actor.name} recorded death for ${patient.name} (Room ${roomNumber}). Room is now free.`,
        meta: {
          causeNote: data.causeNote.trim(),
          occurredAt,
          roomNumber,
          closedCases: metrics.closed,
          mortalityPercent: metrics.ratePercent,
          alertState: metrics.state,
        },
      },
      session
    );

    // If state became BREACH, log MORTALITY_BREACH event (MET-6)
    if (metrics.state === AlertState.BREACH) {
      await recordAuditEvent(
        {
          actor,
          action: 'MORTALITY_BREACH',
          entity: 'FacilitySettings',
          summary: `CRITICAL ALERT: Mortality rate breached 15% threshold (${metrics.ratePercent}% with ${metrics.deceased} deaths in ${metrics.closed} closed cases).`,
          meta: metrics,
        },
        session
      );
    }

    return { patient, freedRoom, deathRecord, metrics };
  });
}
