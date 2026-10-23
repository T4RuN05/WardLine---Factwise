import { Router } from 'express';
import { env } from '../config/env.js';
import { authenticate } from '../middleware/authenticate.js';
import { getSettings } from '../services/settingsService.js';
import { getToday, getNow } from '../services/clock.js';
import { addDays, subDays } from '../domain/dates.js';
import { recordAuditEvent } from '../services/auditService.js';
import { sendSuccess } from '../middleware/errorHandler.js';
import { DomainError, ErrorCodes } from '../domain/errors.js';
import { Patient } from '../models/Patient.js';
import { TemperatureReading } from '../models/TemperatureReading.js';
import { seedDatabase } from '../seed/seed.js';

export const demoRouter = Router();

demoRouter.use((req, res, next) => {
  if (!env.DEMO_MODE || !env.DEMO_TOOLS_ENABLED) {
    return next(
      new DomainError(
        ErrorCodes.PERMISSION_DENIED,
        'Demo tools are disabled in this environment.',
        403
      )
    );
  }
  next();
});

demoRouter.use(authenticate);

// 1. Advance demo clock by N days (default 1)
demoRouter.post('/advance-day', async (req, res, next) => {
  try {
    const days = parseInt(req.body.days || '1', 10);
    const settings = await getSettings();
    const currentNow = getNow(settings);

    const advancedTime = new Date(currentNow.getTime() + days * 24 * 60 * 60 * 1000);
    settings.demoClockNow = advancedTime;
    await settings.save();

    const newToday = getToday(settings);

    await recordAuditEvent({
      actor: req.user,
      action: 'DEMO_ADVANCE_TIME',
      entity: 'FacilitySettings',
      summary: `${req.user.name} advanced demo clock by ${days} day(s) to ${newToday}.`,
      meta: { days, newDate: newToday },
    });

    return sendSuccess(res, {
      simulatedDate: settings.demoClockNow,
      today: newToday,
      daysAdvanced: days,
    });
  } catch (err) {
    next(err);
  }
});

// 2. Auto-fill today's pending readings with afebrile temperatures
demoRouter.post('/auto-fill-today', async (req, res, next) => {
  try {
    const settings = await getSettings();
    const today = getToday(settings);
    const now = getNow(settings);

    const activePatients = await Patient.find({
      status: { $in: ['ADMITTED', 'DISCHARGE_APPROVED'] },
    });

    const activeIds = activePatients.map((p) => p._id);
    const existingReadings = await TemperatureReading.find({
      patientId: { $in: activeIds },
      date: today,
      isActive: true,
    });

    const existingPatientIds = new Set(
      existingReadings.map((r) => r.patientId.toString())
    );
    const pendingPatients = activePatients.filter(
      (p) => !existingPatientIds.has(p._id.toString())
    );

    const created = [];
    for (const patient of pendingPatients) {
      // Generate clean afebrile temperature between 36.6 and 37.2
      const tempVal = Math.round((36.6 + Math.random() * 0.6) * 10) / 10;
      const reading = new TemperatureReading({
        patientId: patient._id,
        date: today,
        recordedAt: now,
        valueC: tempVal,
        recordedBy: req.user._id,
        recordedByRole: req.user.role,
        isFever: false,
        isCritical: false,
        isActive: true,
        correctionReason: 'Simulated auto-fill for demonstration',
      });
      await reading.save();
      created.push(reading);
    }

    await recordAuditEvent({
      actor: req.user,
      action: 'DEMO_AUTO_FILL',
      entity: 'TemperatureReading',
      summary: `${req.user.name} auto-filled ${created.length} afebrile temperature readings for demonstration.`,
      meta: { count: created.length },
    });

    return sendSuccess(res, {
      count: created.length,
      today,
      message: `Successfully populated ${created.length} afebrile readings for today.`,
    });
  } catch (err) {
    next(err);
  }
});

// 3. Reset database to deterministic seed state
demoRouter.post('/reset', async (req, res, next) => {
  try {
    const result = await seedDatabase(true);

    await recordAuditEvent({
      actor: req.user,
      action: 'DEMO_RESET',
      entity: 'Facility',
      summary: `${req.user.name} reset demo data to initial seed state.`,
      meta: result,
    });

    return sendSuccess(res, {
      message: 'Demo dataset reset to initial seed state successfully.',
      details: result,
    });
  } catch (err) {
    next(err);
  }
});
