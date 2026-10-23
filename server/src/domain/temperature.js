import { DomainError, ErrorCodes } from './errors.js';

export const HARD_MIN_C = 32.0;
export const HARD_MAX_C = 43.0;
export const SOFT_MIN_C = 35.0;
export const SOFT_MAX_C = 41.0;

/**
 * Validates temperature value against hard limits (TMP-5).
 */
export function validateTemperatureValue(valueC) {
  if (typeof valueC !== 'number' || isNaN(valueC)) {
    throw new DomainError(
      ErrorCodes.INVALID_TEMPERATURE,
      'Enter a valid numeric temperature.',
      400
    );
  }

  // Hard bounds check
  if (valueC < HARD_MIN_C || valueC > HARD_MAX_C) {
    throw new DomainError(
      ErrorCodes.INVALID_TEMPERATURE,
      `Enter a temperature between ${HARD_MIN_C.toFixed(1)} and ${HARD_MAX_C.toFixed(1)} °C.`,
      400
    );
  }

  // Round to 1 decimal place
  return Math.round(valueC * 10) / 10;
}

/**
 * Checks if a value requires a soft confirmation step (TMP-6).
 */
export function isSoftBoundAnomaly(valueC) {
  return valueC < SOFT_MIN_C || valueC >= SOFT_MAX_C;
}

/**
 * Classifies temperature reading into fever and critical flags (TMP-7).
 */
export function classifyTemperature(valueC, settings = { feverThresholdC: 38.0, criticalThresholdC: 40.0 }) {
  const feverThreshold = settings.feverThresholdC ?? 38.0;
  const criticalThreshold = settings.criticalThresholdC ?? 40.0;

  return {
    isFever: valueC >= feverThreshold,
    isCritical: valueC >= criticalThreshold,
  };
}

export function celsiusToFahrenheit(c) {
  return Math.round(((c * 9) / 5 + 32) * 10) / 10;
}

export function fahrenheitToCelsius(f) {
  return Math.round((((f - 32) * 5) / 9) * 10) / 10;
}
