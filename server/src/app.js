import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';

export const app = express();

app.use(helmet());
app.use(cors({
  origin: env.CLIENT_ORIGIN,
  credentials: true,
}));
app.use(express.json());

if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint (Public, does not reveal secrets)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    facility: 'WardLine Quarantine & Treatment Centre',
    timestamp: new Date().toISOString(),
    demoMode: env.DEMO_MODE,
  });
});
