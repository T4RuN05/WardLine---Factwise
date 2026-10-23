import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/authorize.js';
import { Actions } from '../domain/permissions.js';
import { getSettings, updateSettings } from '../services/settingsService.js';
import { sendSuccess } from '../middleware/errorHandler.js';

export const settingsRouter = Router();

settingsRouter.use(authenticate);

settingsRouter.get('/', async (req, res, next) => {
  try {
    const settings = await getSettings();
    return sendSuccess(res, settings);
  } catch (err) {
    next(err);
  }
});

settingsRouter.patch(
  '/',
  requirePermission(Actions.EDIT_SETTINGS),
  async (req, res, next) => {
    try {
      const updated = await updateSettings(req.body, req.user);
      return sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }
);
