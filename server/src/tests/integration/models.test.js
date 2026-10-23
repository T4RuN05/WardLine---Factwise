import { describe, it, expect } from 'vitest';
import * as models from '../../models/index.js';

describe('Database Models (WP2)', () => {
  it('exports all 9 required Mongoose models', () => {
    expect(models.User).toBeDefined();
    expect(models.Room).toBeDefined();
    expect(models.Patient).toBeDefined();
    expect(models.TemperatureReading).toBeDefined();
    expect(models.DoctorVisit).toBeDefined();
    expect(models.DischargeRecord).toBeDefined();
    expect(models.DeathRecord).toBeDefined();
    expect(models.FacilitySettings).toBeDefined();
    expect(models.AuditEvent).toBeDefined();
  });

  it('has proper schema indexes configured', () => {
    const tempIndexes = models.TemperatureReading.schema.indexes();
    const hasActiveDateIndex = tempIndexes.some(([indexFields, options]) => {
      return (
        indexFields.patientId === 1 &&
        indexFields.date === 1 &&
        options?.unique === true &&
        options?.partialFilterExpression?.isActive === true
      );
    });
    expect(hasActiveDateIndex).toBe(true);

    const visitIndexes = models.DoctorVisit.schema.indexes();
    const hasVisitIndex = visitIndexes.some(([indexFields, options]) => {
      return (
        indexFields.patientId === 1 &&
        indexFields.date === 1 &&
        options?.unique === true
      );
    });
    expect(hasVisitIndex).toBe(true);
  });
});
