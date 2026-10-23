import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatTemperature,
  formatStreak,
  formatMortalityRate,
  getRoomPillColor,
} from '../lib/format.js';

describe('Frontend Formatting Utilities', () => {
  it('formats dates and times cleanly', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDateTime(null)).toBe('—');
    expect(formatDate('2026-10-23')).toContain('2026');
  });

  it('formats temperatures with 1 decimal place and unit', () => {
    expect(formatTemperature(37.54)).toBe('37.5 °C');
    expect(formatTemperature(38)).toBe('38.0 °C');
    expect(formatTemperature(null)).toBe('—');
  });

  it('formats afebrile streak with target denominator', () => {
    expect(formatStreak(0, 3)).toBe('0/3');
    expect(formatStreak(3, 3)).toBe('3/3');
    expect(formatStreak(null, 3)).toBe('0/3');
  });

  it('formats mortality rates as percentage strings', () => {
    expect(formatMortalityRate(0.14)).toBe('14.0%');
    expect(formatMortalityRate(0.15686)).toBe('15.7%');
    expect(formatMortalityRate(null)).toBe('0.0%');
  });

  it('determines room status color classes', () => {
    expect(getRoomPillColor('FREE')).toContain('emerald');
    expect(getRoomPillColor('OCCUPIED')).toContain('blue');
    expect(getRoomPillColor('CLEANING')).toContain('amber');
    expect(getRoomPillColor('MAINTENANCE')).toContain('rose');
  });
});
