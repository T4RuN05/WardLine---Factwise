import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/authorize.js';
import { Actions } from '../domain/permissions.js';
import {
  getOverview,
  getNurseWorklist,
  getDoctorRounds,
  getDirectorAnalytics,
} from '../services/readService.js';
import { sendSuccess } from '../middleware/errorHandler.js';

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);

// 1. Common Overview (All roles)
dashboardRouter.get(['/dashboard/overview', '/overview'], async (req, res, next) => {
  try {
    const overview = await getOverview();
    return sendSuccess(res, overview);
  } catch (err) {
    next(err);
  }
});

// 2. Nurse Worklist (NURSE, DIRECTOR)
dashboardRouter.get(
  '/nurse/worklist',
  requirePermission(Actions.VIEW_NURSE_WORKLIST),
  async (req, res, next) => {
    try {
      const ward = req.query.ward || 'ALL';
      const worklist = await getNurseWorklist(ward);
      return sendSuccess(res, worklist);
    } catch (err) {
      next(err);
    }
  }
);

// 3. Doctor Rounds (DOCTOR, DIRECTOR)
dashboardRouter.get(
  '/doctor/rounds',
  requirePermission(Actions.VIEW_DOCTOR_ROUNDS),
  async (req, res, next) => {
    try {
      const filter = req.query.filter || 'ALL';
      const rounds = await getDoctorRounds(filter);
      return sendSuccess(res, rounds);
    } catch (err) {
      next(err);
    }
  }
);

// 4. Director Analytics (DIRECTOR)
dashboardRouter.get(
  '/director/analytics',
  requirePermission(Actions.VIEW_FULL_ANALYTICS),
  async (req, res, next) => {
    try {
      const window = req.query.window || 'ALL';
      const analytics = await getDirectorAnalytics(window);
      return sendSuccess(res, analytics);
    } catch (err) {
      next(err);
    }
  }
);
