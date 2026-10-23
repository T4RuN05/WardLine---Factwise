import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/authorize.js';
import { Actions } from '../domain/permissions.js';
import { correctTemperature } from '../services/temperatureService.js';
import { sendSuccess } from '../middleware/errorHandler.js';

export const temperatureRouter = Router();

temperatureRouter.use(authenticate);

// Correct today's active reading with reason (NURSE, TMP-3)
temperatureRouter.patch(
  '/:id/correction',
  requirePermission(Actions.CORRECT_TEMPERATURE),
  async (req, res, next) => {
    try {
      const { valueC, reason } = req.body;
      const result = await correctTemperature(
        req.params.id,
        valueC,
        reason,
        req.user
      );
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);
