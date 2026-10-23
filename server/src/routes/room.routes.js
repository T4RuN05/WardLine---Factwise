import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { getBedMap } from '../services/readService.js';
import { sendSuccess } from '../middleware/errorHandler.js';

export const roomRouter = Router();

roomRouter.use(authenticate);

roomRouter.get('/', async (req, res, next) => {
  try {
    const bedMap = await getBedMap();
    return sendSuccess(res, bedMap);
  } catch (err) {
    next(err);
  }
});
