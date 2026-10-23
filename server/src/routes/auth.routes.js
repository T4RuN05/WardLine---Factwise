import { Router } from 'express';
import { getDemoPersonas, demoLogin } from '../services/authService.js';
import { authenticate } from '../middleware/authenticate.js';
import { sendSuccess } from '../middleware/errorHandler.js';

export const authRouter = Router();

authRouter.get('/personas', async (req, res, next) => {
  try {
    const personas = await getDemoPersonas();
    return sendSuccess(res, personas);
  } catch (err) {
    next(err);
  }
});

authRouter.post('/demo-login', async (req, res, next) => {
  try {
    const { userId } = req.body;
    const result = await demoLogin(userId);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

authRouter.get('/me', authenticate, async (req, res, next) => {
  try {
    return sendSuccess(res, {
      id: req.user._id,
      name: req.user.name,
      role: req.user.role,
      title: req.user.title,
    });
  } catch (err) {
    next(err);
  }
});
