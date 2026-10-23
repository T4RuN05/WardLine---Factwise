import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/authorize.js';
import { Actions } from '../domain/permissions.js';
import { getDischargeQueue } from '../services/readService.js';
import { sendSuccess } from '../middleware/errorHandler.js';

export const dischargeRouter = Router();

dischargeRouter.use(authenticate);

// View discharge queue (DOCTOR, ADMIN, DIRECTOR)
dischargeRouter.get(
  '/',
  requirePermission(Actions.VIEW_DISCHARGE_QUEUE),
  async (req, res, next) => {
    try {
      const queue = await getDischargeQueue();
      return sendSuccess(res, queue);
    } catch (err) {
      next(err);
    }
  }
);
