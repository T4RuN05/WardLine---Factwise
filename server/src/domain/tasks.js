export const TaskStatus = {
  NEEDS_TEMPERATURE: 'NEEDS_TEMPERATURE',
  READY_FOR_DOCTOR: 'READY_FOR_DOCTOR',
  COMPLETE: 'COMPLETE',
  NOT_APPLICABLE: 'NOT_APPLICABLE',
};

/**
 * Derives daily task status for a patient given today's active reading and visit (TSK-1, TSK-3).
 */
export function getTaskStatus(patient, todayReading, todayVisit) {
  if (!patient || patient.status === 'DISCHARGED' || patient.status === 'DECEASED') {
    return TaskStatus.NOT_APPLICABLE;
  }

  const hasReading = !!todayReading && todayReading.isActive;
  const hasVisit = !!todayVisit;

  if (!hasReading) {
    return TaskStatus.NEEDS_TEMPERATURE;
  }

  if (!hasVisit) {
    return TaskStatus.READY_FOR_DOCTOR;
  }

  return TaskStatus.COMPLETE;
}

/**
 * Sorts patients for Doctor Rounds (TSK-2):
 * 1. Critical fever readings today
 * 2. Discharge-eligible and not yet approved
 * 3. Other fever readings
 * 4. Ready to visit by room number
 * 5. Awaiting temperature by room number
 * 6. Complete
 */
export function sortDoctorRounds(items) {
  return [...items].sort((a, b) => {
    // 1. Critical fever readings today
    const aCrit = a.todayReading?.isCritical ? 1 : 0;
    const bCrit = b.todayReading?.isCritical ? 1 : 0;
    if (aCrit !== bCrit) return bCrit - aCrit;

    // 2. Discharge-eligible and not yet approved
    const aElig = (a.eligibility?.eligible && a.status !== 'DISCHARGE_APPROVED') ? 1 : 0;
    const bElig = (b.eligibility?.eligible && b.status !== 'DISCHARGE_APPROVED') ? 1 : 0;
    if (aElig !== bElig) return bElig - aElig;

    // 3. Other fever readings today
    const aFever = a.todayReading?.isFever ? 1 : 0;
    const bFever = b.todayReading?.isFever ? 1 : 0;
    if (aFever !== bFever) return bFever - aFever;

    // 4. Ready to visit (has reading, no visit)
    const aReady = a.taskStatus === TaskStatus.READY_FOR_DOCTOR ? 1 : 0;
    const bReady = b.taskStatus === TaskStatus.READY_FOR_DOCTOR ? 1 : 0;
    if (aReady !== bReady) return bReady - aReady;

    // 5. Awaiting temperature
    const aWait = a.taskStatus === TaskStatus.NEEDS_TEMPERATURE ? 1 : 0;
    const bWait = b.taskStatus === TaskStatus.NEEDS_TEMPERATURE ? 1 : 0;
    if (aWait !== bWait) return bWait - aWait;

    // Tie-break by room number ascending
    const roomA = a.roomNumber || a.room?.number || 999;
    const roomB = b.roomNumber || b.room?.number || 999;
    return roomA - roomB;
  });
}
