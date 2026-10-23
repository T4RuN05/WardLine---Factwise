import { FacilitySettings } from '../models/FacilitySettings.js';
import { recordAuditEvent } from './auditService.js';
import { DomainError, ErrorCodes } from '../domain/errors.js';

export async function getSettings() {
  let settings = await FacilitySettings.findOne();
  if (!settings) {
    settings = await FacilitySettings.create({
      facilityName: 'WardLine Quarantine & Treatment Centre',
      capacity: 74,
      feverThresholdC: 38.0,
      criticalThresholdC: 40.0,
      requiredFeverFreeDays: 3,
      mortalityBenchmark: 0.15,
      mortalityWarningRatio: 0.12,
      minClosedCasesForAlert: 20,
      requireDoctorApproval: true,
      approvedNotDischargedSlaHours: 4,
      facilityTimezone: 'Asia/Kolkata',
    });
  }
  return settings;
}

export async function updateSettings(updates, actor) {
  const settings = await getSettings();

  // Validate threshold bounds if changed
  if (updates.feverThresholdC !== undefined) {
    if (updates.feverThresholdC < 36.0 || updates.feverThresholdC > 41.0) {
      throw new DomainError(
        ErrorCodes.INVALID_STATE,
        'Fever threshold must be between 36.0 and 41.0 °C.'
      );
    }
    settings.feverThresholdC = updates.feverThresholdC;
  }

  if (updates.criticalThresholdC !== undefined) {
    if (updates.criticalThresholdC < 38.0 || updates.criticalThresholdC > 43.0) {
      throw new DomainError(
        ErrorCodes.INVALID_STATE,
        'Critical threshold must be between 38.0 and 43.0 °C.'
      );
    }
    settings.criticalThresholdC = updates.criticalThresholdC;
  }

  if (updates.requiredFeverFreeDays !== undefined) {
    if (updates.requiredFeverFreeDays < 1 || updates.requiredFeverFreeDays > 14) {
      throw new DomainError(
        ErrorCodes.INVALID_STATE,
        'Required fever-free days must be between 1 and 14.'
      );
    }
    settings.requiredFeverFreeDays = updates.requiredFeverFreeDays;
  }

  if (updates.mortalityBenchmark !== undefined) {
    if (updates.mortalityBenchmark <= 0 || updates.mortalityBenchmark >= 1) {
      throw new DomainError(
        ErrorCodes.INVALID_STATE,
        'Mortality benchmark must be between 0 and 1.'
      );
    }
    settings.mortalityBenchmark = updates.mortalityBenchmark;
  }

  if (updates.requireDoctorApproval !== undefined) {
    settings.requireDoctorApproval = Boolean(updates.requireDoctorApproval);
  }

  if (updates.facilityName !== undefined) {
    settings.facilityName = updates.facilityName.trim();
  }

  await settings.save();

  await recordAuditEvent({
    actor,
    action: 'SETTINGS_UPDATED',
    entity: 'FacilitySettings',
    entityId: settings._id,
    summary: `${actor.name} updated facility configuration settings.`,
    meta: updates,
  });

  return settings;
}
