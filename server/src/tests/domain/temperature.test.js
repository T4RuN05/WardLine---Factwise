import { describe, it, expect } from 'vitest';
import {
  validateTemperatureValue,
  isSoftBoundAnomaly,
  classifyTemperature,
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  HARD_MIN_C,
  HARD_MAX_C,
} from '../../domain/temperature.js';
import { ErrorCodes } from '../../domain/errors.js';

describe('Domain: Temperature (TMP rules)', () => {
  describe('TMP-5 Hard Bounds', () => {
    it('accepts valid values between 32.0 and 43.0 and rounds to 1 decimal', () => {
      expect(validateTemperatureValue(36.56)).toBe(36.6);
      expect(validateTemperatureValue(32.0)).toBe(32.0);
      expect(validateTemperatureValue(43.0)).toBe(43.0);
    });

    it('rejects values below 32.0', () => {
      expect(() => validateTemperatureValue(31.9)).toThrowError(
        expect.objectContaining({ code: ErrorCodes.INVALID_TEMPERATURE })
      );
    });

    it('rejects values above 43.0', () => {
      expect(() => validateTemperatureValue(43.1)).toThrowError(
        expect.objectContaining({ code: ErrorCodes.INVALID_TEMPERATURE })
      );
    });

    it('rejects non-numeric inputs', () => {
      expect(() => validateTemperatureValue(NaN)).toThrowError();
      expect(() => validateTemperatureValue('hot')).toThrowError();
    });
  });

  describe('TMP-6 Soft Bounds', () => {
    it('flags values below 35.0 as anomaly requiring confirmation', () => {
      expect(isSoftBoundAnomaly(34.9)).toBe(true);
      expect(isSoftBoundAnomaly(35.0)).toBe(false);
    });

    it('flags values at or above 41.0 as anomaly requiring confirmation', () => {
      expect(isSoftBoundAnomaly(40.9)).toBe(false);
      expect(isSoftBoundAnomaly(41.0)).toBe(true);
      expect(isSoftBoundAnomaly(42.5)).toBe(true);
    });
  });

  describe('TMP-7 Fever and Critical Classification', () => {
    const settings = { feverThresholdC: 38.0, criticalThresholdC: 40.0 };

    it('classifies reading below 38.0 as afebrile', () => {
      const result = classifyTemperature(37.5, settings);
      expect(result.isFever).toBe(false);
      expect(result.isCritical).toBe(false);
    });

    it('classifies reading exactly 38.0 as fever', () => {
      const result = classifyTemperature(38.0, settings);
      expect(result.isFever).toBe(true);
      expect(result.isCritical).toBe(false);
    });

    it('classifies reading between 38.0 and 39.9 as fever but not critical', () => {
      const result = classifyTemperature(39.2, settings);
      expect(result.isFever).toBe(true);
      expect(result.isCritical).toBe(false);
    });

    it('classifies reading at or above 40.0 as critical fever', () => {
      const result = classifyTemperature(40.0, settings);
      expect(result.isFever).toBe(true);
      expect(result.isCritical).toBe(true);

      const highResult = classifyTemperature(41.5, settings);
      expect(highResult.isFever).toBe(true);
      expect(highResult.isCritical).toBe(true);
    });
  });

  describe('TMP-11 Unit Conversion', () => {
    it('converts Celsius to Fahrenheit correctly', () => {
      expect(celsiusToFahrenheit(37.0)).toBe(98.6);
      expect(celsiusToFahrenheit(38.0)).toBe(100.4);
    });

    it('converts Fahrenheit to Celsius correctly', () => {
      expect(fahrenheitToCelsius(98.6)).toBe(37.0);
      expect(fahrenheitToCelsius(100.4)).toBe(38.0);
    });
  });
});
