import { describe, it, expect } from 'vitest';
import { computeMortality, AlertState } from '../../domain/metrics.js';

describe('Domain: Metrics & Mortality (MET rules)', () => {
  const settings = {
    mortalityBenchmark: 0.15,
    mortalityWarningRatio: 0.12,
    minClosedCasesForAlert: 20,
  };

  it('excludes active patients from closed case denominator (MET-1)', () => {
    const cases = [
      { status: 'DECEASED' },
      { status: 'DISCHARGED' },
      { status: 'ADMITTED' }, // Active patient
      { status: 'DISCHARGE_APPROVED' }, // Active patient
    ];

    const result = computeMortality(cases, { ...settings, minClosedCasesForAlert: 2 });
    expect(result.deceased).toBe(1);
    expect(result.discharged).toBe(1);
    expect(result.closed).toBe(2);
    expect(result.rate).toBe(0.5);
    expect(result.successRate).toBe(0.5);
  });

  it('returns INSUFFICIENT_DATA when closed cases are below minClosedCasesForAlert (MET-3)', () => {
    // 19 closed cases (1 below 20)
    const cases = [
      ...Array(5).fill({ status: 'DECEASED' }),
      ...Array(14).fill({ status: 'DISCHARGED' }),
    ];

    const result = computeMortality(cases, settings);
    expect(result.closed).toBe(19);
    expect(result.state).toBe(AlertState.INSUFFICIENT_DATA);
  });

  it('classifies 14.0% mortality (7/50) as WARNING (MET-4)', () => {
    // Seed dataset initial state: 7 deceased, 43 discharged = 7/50 = 14.0%
    const cases = [
      ...Array(7).fill({ status: 'DECEASED' }),
      ...Array(43).fill({ status: 'DISCHARGED' }),
    ];

    const result = computeMortality(cases, settings);
    expect(result.closed).toBe(50);
    expect(result.ratePercent).toBe(14.0);
    expect(result.successRatePercent).toBe(86.0);
    expect(result.state).toBe(AlertState.WARNING);
  });

  it('classifies 15.0% mortality as WARNING (benchmark is 15%, breach strictly > 15%)', () => {
    // 15 deceased out of 100 closed cases = 15.0%
    const cases = [
      ...Array(15).fill({ status: 'DECEASED' }),
      ...Array(85).fill({ status: 'DISCHARGED' }),
    ];

    const result = computeMortality(cases, settings);
    expect(result.ratePercent).toBe(15.0);
    expect(result.state).toBe(AlertState.WARNING);
  });

  it('classifies 15.7% mortality (8/51) as BREACH (MET-4)', () => {
    // After recording 1 death during evaluation: 8 deceased, 43 discharged = 8/51 = 15.686%
    const cases = [
      ...Array(8).fill({ status: 'DECEASED' }),
      ...Array(43).fill({ status: 'DISCHARGED' }),
    ];

    const result = computeMortality(cases, settings);
    expect(result.closed).toBe(51);
    expect(result.ratePercent).toBe(15.7);
    expect(result.state).toBe(AlertState.BREACH);
  });

  it('classifies mortality below 12.0% as NORMAL (MET-4)', () => {
    // 5 deceased out of 50 closed cases = 10.0%
    const cases = [
      ...Array(5).fill({ status: 'DECEASED' }),
      ...Array(45).fill({ status: 'DISCHARGED' }),
    ];

    const result = computeMortality(cases, settings);
    expect(result.ratePercent).toBe(10.0);
    expect(result.successRatePercent).toBe(90.0);
    expect(result.state).toBe(AlertState.NORMAL);
  });
});
