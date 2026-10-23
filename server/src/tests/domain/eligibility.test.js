import { describe, it, expect } from 'vitest';
import { computeStreak } from '../../domain/eligibility.js';

describe('Domain: Discharge Eligibility & Streak (DIS rules)', () => {
  const today = '2024-10-23';
  const settings = { requiredFeverFreeDays: 3 };

  it('marks eligible when 3 consecutive facility days are afebrile', () => {
    const readings = [
      { date: '2024-10-21', isFever: false, valueC: 36.8, isActive: true },
      { date: '2024-10-22', isFever: false, valueC: 37.0, isActive: true },
      { date: '2024-10-23', isFever: false, valueC: 36.9, isActive: true },
    ];

    const result = computeStreak(readings, today, settings);
    expect(result.length).toBe(3);
    expect(result.eligible).toBe(true);
    expect(result.eligibleOn).toBe('2024-10-23');
    expect(result.stale).toBe(false);
  });

  it('breaks streak when today has fever (DIS-1)', () => {
    const readings = [
      { date: '2024-10-21', isFever: false, valueC: 36.8, isActive: true },
      { date: '2024-10-22', isFever: false, valueC: 37.0, isActive: true },
      { date: '2024-10-23', isFever: true, valueC: 38.5, isActive: true },
    ];

    const result = computeStreak(readings, today, settings);
    expect(result.length).toBe(0);
    expect(result.eligible).toBe(false);
  });

  it('breaks streak if middle day is missing (DIS-8)', () => {
    // 2024-10-21 ok, 2024-10-22 MISSING, 2024-10-23 ok
    const readings = [
      { date: '2024-10-21', isFever: false, valueC: 36.8, isActive: true },
      { date: '2024-10-23', isFever: false, valueC: 36.9, isActive: true },
    ];

    const result = computeStreak(readings, today, settings);
    // Streak from latest reading (23rd) stops at missing 22nd -> length 1
    expect(result.length).toBe(1);
    expect(result.eligible).toBe(false);
  });

  it('allows streak ending yesterday (e.g. today pending)', () => {
    // Yesterday completed 3rd day
    const readings = [
      { date: '2024-10-20', isFever: false, valueC: 36.8, isActive: true },
      { date: '2024-10-21', isFever: false, valueC: 37.0, isActive: true },
      { date: '2024-10-22', isFever: false, valueC: 36.9, isActive: true },
    ];

    const result = computeStreak(readings, today, settings);
    expect(result.length).toBe(3);
    expect(result.eligible).toBe(true);
    expect(result.stale).toBe(false);
  });

  it('marks streak as stale if latest reading is older than yesterday', () => {
    // Latest reading was 2024-10-20 (3 days before today)
    const readings = [
      { date: '2024-10-18', isFever: false, valueC: 36.8, isActive: true },
      { date: '2024-10-19', isFever: false, valueC: 37.0, isActive: true },
      { date: '2024-10-20', isFever: false, valueC: 36.9, isActive: true },
    ];

    const result = computeStreak(readings, today, settings);
    expect(result.stale).toBe(true);
    expect(result.length).toBe(0);
    expect(result.eligible).toBe(false);
  });

  it('ignores superseded (inactive) readings', () => {
    const readings = [
      { date: '2024-10-21', isFever: false, valueC: 36.8, isActive: true },
      { date: '2024-10-22', isFever: false, valueC: 37.0, isActive: true },
      { date: '2024-10-23', isFever: true, valueC: 38.6, isActive: false }, // corrected away
      { date: '2024-10-23', isFever: false, valueC: 37.2, isActive: true }, // new active reading
    ];

    const result = computeStreak(readings, today, settings);
    expect(result.length).toBe(3);
    expect(result.eligible).toBe(true);
  });
});
