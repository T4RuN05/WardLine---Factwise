import { Patient } from '../models/Patient.js';
import { Room } from '../models/Room.js';
import { TemperatureReading } from '../models/TemperatureReading.js';
import { withTransaction } from '../config/database.js';
import { getSettings } from './settingsService.js';
import { getToday, getNow } from './clock.js';
import { recordAuditEvent } from './auditService.js';
import { DomainError, ErrorCodes } from '../domain/errors.js';
import { validateTemperatureValue, classifyTemperature } from '../domain/temperature.js';

export async function admitPatient(data, actor) {
  const settings = await getSettings();
  const today = getToday(settings);
  const now = getNow(settings);

  // 1. Capacity check (ADM-1)
  const occupiedCount = await Room.countDocuments({ status: 'OCCUPIED' });
  if (occupiedCount >= settings.capacity) {
    throw new DomainError(
      ErrorCodes.ROOM_FULL,
      `All ${settings.capacity} rooms are occupied. Discharge or close a case to free a room.`,
      409
    );
  }

  // 2. Room availability check (ADM-2)
  const room = await Room.findById(data.roomId);
  if (!room || room.status !== 'AVAILABLE') {
    throw new DomainError(
      ErrorCodes.ROOM_OCCUPIED,
      `Room ${room?.number || ''} is no longer available. Please select another room.`,
      409
    );
  }

  // 3. Duplicate active patient warning check (ADM-4)
  if (!data.confirmDuplicate) {
    const existing = await Patient.findOne({
      name: new RegExp(`^${data.name.trim()}$`, 'i'),
      phone: data.phone.trim(),
      status: { $in: ['ADMITTED', 'DISCHARGE_APPROVED'] },
    }).populate('roomId');

    if (existing) {
      throw new DomainError(
        ErrorCodes.INVALID_STATE,
        `A patient with this name and phone is already admitted in room ${existing.roomNumber}.`,
        409,
        {
          duplicateWarning: true,
          existingPatient: {
            id: existing._id,
            name: existing.name,
            roomNumber: existing.roomNumber,
          },
        }
      );
    }
  }

  // 4. Generate sequential MRN (ADM-6)
  const countTotalPatients = await Patient.countDocuments();
  const mrn = `QF-${String(countTotalPatients + 1).padStart(6, '0')}`;

  // Execute admission atomically in transaction
  return await withTransaction(async (session) => {
    // Re-verify room lock inside transaction
    const lockedRoom = await Room.findById(room._id).session(session);
    if (!lockedRoom || lockedRoom.status !== 'AVAILABLE') {
      throw new DomainError(
        ErrorCodes.ROOM_OCCUPIED,
        `Room ${room.number} was just occupied by another admission.`,
        409
      );
    }

    const patient = new Patient({
      mrn,
      name: data.name.trim(),
      age: data.age,
      sex: data.sex,
      phone: data.phone.trim(),
      emergencyContact: {
        name: data.emergencyContact.name.trim(),
        phone: data.emergencyContact.phone.trim(),
        relationship: data.emergencyContact.relationship || 'Family',
      },
      admittedOn: today,
      admittedAt: now,
      admittedBy: actor._id,
      roomId: room._id,
      roomNumber: room.number,
      status: 'ADMITTED',
      notes: data.notes || '',
    });

    await patient.save({ session });

    // Mark room OCCUPIED
    lockedRoom.status = 'OCCUPIED';
    lockedRoom.patientId = patient._id;
    await lockedRoom.save({ session });

    // Optional admission temperature reading (ADM-5)
    let initialReading = null;
    if (data.recordTemperatureNow && data.initialTemperatureValue) {
      const validVal = validateTemperatureValue(data.initialTemperatureValue);
      const { isFever, isCritical } = classifyTemperature(validVal, settings);

      initialReading = new TemperatureReading({
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

      await initialReading.save({ session });
    }

    // Record audit event
    await recordAuditEvent(
      {
        actor,
        action: 'PATIENT_ADMITTED',
        entity: 'Patient',
        entityId: patient._id,
        patientId: patient._id,
        patientName: patient.name,
        summary: `${actor.name} admitted ${patient.name} into Room ${room.number} (MRN: ${mrn}).`,
        meta: { roomNumber: room.number, mrn, withInitialReading: !!initialReading },
      },
      session
    );

    return { patient, room: lockedRoom, initialReading };
  });
}
