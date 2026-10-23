import { describe, it, expect } from 'vitest';
import { getTaskStatus, sortDoctorRounds, TaskStatus } from '../../domain/tasks.js';

describe('Domain: Tasks (TSK rules)', () => {
  describe('getTaskStatus', () => {
    const patient = { _id: 'p1', status: 'ADMITTED' };

    it('returns NEEDS_TEMPERATURE when no reading exists today', () => {
      expect(getTaskStatus(patient, null, null)).toBe(TaskStatus.NEEDS_TEMPERATURE);
      expect(getTaskStatus(patient, { isActive: false }, null)).toBe(TaskStatus.NEEDS_TEMPERATURE);
    });

    it('returns READY_FOR_DOCTOR when reading exists but no visit', () => {
      const reading = { _id: 'r1', isActive: true, valueC: 37.2 };
      expect(getTaskStatus(patient, reading, null)).toBe(TaskStatus.READY_FOR_DOCTOR);
    });

    it('returns COMPLETE when both reading and visit exist', () => {
      const reading = { _id: 'r1', isActive: true, valueC: 37.2 };
      const visit = { _id: 'v1' };
      expect(getTaskStatus(patient, reading, visit)).toBe(TaskStatus.COMPLETE);
    });

    it('returns NOT_APPLICABLE for closed patients', () => {
      expect(getTaskStatus({ status: 'DISCHARGED' }, null, null)).toBe(TaskStatus.NOT_APPLICABLE);
      expect(getTaskStatus({ status: 'DECEASED' }, null, null)).toBe(TaskStatus.NOT_APPLICABLE);
    });
  });

  describe('TSK-2 sortDoctorRounds ordering', () => {
    it('orders by: (1) critical, (2) eligible, (3) other fever, (4) ready, (5) awaiting temp, (6) complete', () => {
      const list = [
        { id: 'awaiting', roomNumber: 10, taskStatus: TaskStatus.NEEDS_TEMPERATURE },
        { id: 'complete', roomNumber: 5, taskStatus: TaskStatus.COMPLETE },
        { id: 'ready-normal', roomNumber: 12, taskStatus: TaskStatus.READY_FOR_DOCTOR, todayReading: { isFever: false } },
        { id: 'fever', roomNumber: 8, taskStatus: TaskStatus.READY_FOR_DOCTOR, todayReading: { isFever: true, isCritical: false } },
        { id: 'eligible', roomNumber: 22, taskStatus: TaskStatus.READY_FOR_DOCTOR, status: 'ADMITTED', eligibility: { eligible: true } },
        { id: 'critical', roomNumber: 41, taskStatus: TaskStatus.READY_FOR_DOCTOR, todayReading: { isFever: true, isCritical: true } },
      ];

      const sorted = sortDoctorRounds(list);
      expect(sorted.map((item) => item.id)).toEqual([
        'critical',
        'eligible',
        'fever',
        'ready-normal',
        'awaiting',
        'complete',
      ]);
    });

    it('tie-breaks by room number ascending', () => {
      const list = [
        { id: 'room-30', roomNumber: 30, taskStatus: TaskStatus.READY_FOR_DOCTOR },
        { id: 'room-15', roomNumber: 15, taskStatus: TaskStatus.READY_FOR_DOCTOR },
      ];

      const sorted = sortDoctorRounds(list);
      expect(sorted.map((item) => item.id)).toEqual(['room-15', 'room-30']);
    });
  });
});
