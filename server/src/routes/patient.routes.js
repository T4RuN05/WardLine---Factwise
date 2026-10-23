import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission, requireRole } from '../middleware/authorize.js';
import { Actions } from '../domain/permissions.js';
import { sendSuccess } from '../middleware/errorHandler.js';
import { admitPatient } from '../services/admissionService.js';
import {
  recordTemperature,
  doctorOverrideTemperature,
} from '../services/temperatureService.js';
import { logDoctorVisit } from '../services/visitService.js';
import {
  approveDischarge,
  revokeDischarge,
  completeDischarge,
} from '../services/dischargeService.js';
import { recordDeath } from '../services/deathService.js';
import { getPatientsList, getPatientProfile } from '../services/readService.js';
import { Patient } from '../models/Patient.js';
import { recordAuditEvent } from '../services/auditService.js';
import { DomainError, ErrorCodes } from '../domain/errors.js';

export const patientRouter = Router();

patientRouter.use(authenticate);

// 1. Search / filter patient list
patientRouter.get('/', async (req, res, next) => {
  try {
    const result = await getPatientsList(req.query);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

// 2. Admit patient (NURSE or ADMIN)
patientRouter.post(
  '/',
  requirePermission(Actions.ADMIT_PATIENT),
  async (req, res, next) => {
    try {
      const result = await admitPatient(req.body, req.user);
      return sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }
);

// 3. Get single patient profile
patientRouter.get('/:id', async (req, res, next) => {
  try {
    const profile = await getPatientProfile(req.params.id);
    if (!profile) {
      throw new DomainError(ErrorCodes.NOT_FOUND, 'Patient not found.', 404);
    }
    return sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
});

// 4. Update patient demographics (NURSE or ADMIN)
patientRouter.patch(
  '/:id',
  requirePermission(Actions.UPDATE_PATIENT_DEMOGRAPHICS),
  async (req, res, next) => {
    try {
      const patient = await Patient.findById(req.params.id);
      if (!patient) {
        throw new DomainError(ErrorCodes.NOT_FOUND, 'Patient not found.', 404);
      }
      if (patient.status === 'DISCHARGED' || patient.status === 'DECEASED') {
        throw new DomainError(
          ErrorCodes.PATIENT_CLOSED,
          'Cannot edit demographics for closed cases.',
          400
        );
      }

      const allowedFields = ['name', 'age', 'sex', 'phone', 'emergencyContact', 'notes'];
      const updates = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
          patient[field] = req.body[field];
        }
      }

      await patient.save();

      await recordAuditEvent({
        actor: req.user,
        action: 'PATIENT_DEMOGRAPHICS_UPDATED',
        entity: 'Patient',
        entityId: patient._id,
        patientId: patient._id,
        patientName: patient.name,
        summary: `${req.user.name} updated demographics for ${patient.name}.`,
        meta: updates,
      });

      return sendSuccess(res, patient);
    } catch (err) {
      next(err);
    }
  }
);

// 5. Record today's temperature (NURSE)
patientRouter.post(
  '/:id/temperatures',
  requirePermission(Actions.RECORD_TEMPERATURE),
  async (req, res, next) => {
    try {
      const { valueC } = req.body;
      const result = await recordTemperature(req.params.id, valueC, req.user);
      return sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }
);

// 6. Doctor override temperature (DOCTOR)
patientRouter.post(
  '/:id/temperatures/doctor-override',
  requirePermission(Actions.DOCTOR_OVERRIDE_TEMPERATURE),
  async (req, res, next) => {
    try {
      const { valueC, reason } = req.body;
      const result = await doctorOverrideTemperature(
        req.params.id,
        valueC,
        reason,
        req.user
      );
      return sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }
);

// 7. Log doctor visit (DOCTOR)
patientRouter.post(
  '/:id/visits',
  requirePermission(Actions.LOG_DOCTOR_VISIT),
  async (req, res, next) => {
    try {
      const result = await logDoctorVisit(req.params.id, req.body, req.user);
      return sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }
);

// 8. Approve discharge (DOCTOR)
patientRouter.post(
  '/:id/discharge/approve',
  requirePermission(Actions.APPROVE_DISCHARGE),
  async (req, res, next) => {
    try {
      const result = await approveDischarge(req.params.id, req.user);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

// 9. Revoke discharge (DOCTOR)
patientRouter.post(
  '/:id/discharge/revoke',
  requirePermission(Actions.REVOKE_DISCHARGE),
  async (req, res, next) => {
    try {
      const { reason } = req.body;
      const result = await revokeDischarge(req.params.id, reason, req.user);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

// 10. Complete discharge checkout (ADMIN)
patientRouter.post(
  '/:id/discharge/complete',
  requirePermission(Actions.COMPLETE_DISCHARGE),
  async (req, res, next) => {
    try {
      const result = await completeDischarge(req.params.id, req.user);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

// 11. Record death (DOCTOR)
patientRouter.post(
  '/:id/death',
  requirePermission(Actions.RECORD_DEATH),
  async (req, res, next) => {
    try {
      const result = await recordDeath(req.params.id, req.body, req.user);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);
