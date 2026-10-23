import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/authorize.js';
import { Actions } from '../domain/permissions.js';
import { getAuditLog } from '../services/readService.js';
import { sendSuccess } from '../middleware/errorHandler.js';

export const auditRouter = Router();

auditRouter.use(authenticate);

auditRouter.get(
  '/',
  requirePermission(Actions.VIEW_AUDIT_LOG),
  async (req, res, next) => {
    try {
      const result = await getAuditLog(req.query);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);
