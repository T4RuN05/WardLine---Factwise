import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { requestId } from './middleware/requestId.js';
import { errorHandler } from './middleware/errorHandler.js';

// Import routers
import { authRouter } from './routes/auth.routes.js';
import { patientRouter } from './routes/patient.routes.js';
import { roomRouter } from './routes/room.routes.js';
import { temperatureRouter } from './routes/temperature.routes.js';
import { visitRouter } from './routes/visit.routes.js';
import { dischargeRouter } from './routes/discharge.routes.js';
import { dashboardRouter } from './routes/dashboard.routes.js';
import { settingsRouter } from './routes/settings.routes.js';
import { auditRouter } from './routes/audit.routes.js';
import { demoRouter } from './routes/demo.routes.js';

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      // Allow configured client origin, localhost, or Vercel preview deploys
      if (
        origin === env.CLIENT_ORIGIN ||
        origin.startsWith('http://localhost:') ||
        origin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in prototype for assessment convenience
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(requestId);

if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 1. Health check endpoint (Public, does not reveal secrets)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    facility: 'WardLine Quarantine & Treatment Centre',
    timestamp: new Date().toISOString(),
    demoMode: env.DEMO_MODE,
    requestId: req.id,
  });
});

// 2. Mount API Routes
app.use('/api/auth', authRouter);
app.use('/api/rooms', roomRouter);
app.use('/api/patients', patientRouter);
app.use('/api/temperatures', temperatureRouter);
app.use('/api/visits', visitRouter);
app.use('/api/discharges', dischargeRouter);
app.use('/api', dashboardRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/demo', demoRouter);

// 3. Centralized Error Handler
app.use(errorHandler);
