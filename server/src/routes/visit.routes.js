import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/authorize.js';
import { Actions } from '../domain/permissions.js';
import { addVisitAddendum } from '../services/visitService.js';
import { sendSuccess } from '../middleware/errorHandler.js';

export const visitRouter = Router();

visitRouter.use(authenticate);

// Append addendum to visit note (DOCTOR, VIS-3)
visitRouter.post(
  '/:id/addenda',
  requirePermission(Actions.LOG_DOCTOR_VISIT),
  async (req, res, next) => {
    try {
      const { text } = req.body;
      const result = await addVisitAddendum(req.params.id, text, req.user);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);
