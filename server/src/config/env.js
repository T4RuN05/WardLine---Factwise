import dotenv from 'dotenv';
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wardline_demo',
  JWT_SECRET: process.env.JWT_SECRET || 'super-secret-demo-key-for-wardline-facility-assessment-2024',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '4h',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  FACILITY_TIMEZONE: process.env.FACILITY_TIMEZONE || 'Asia/Kolkata',
  DEMO_MODE: process.env.DEMO_MODE === 'true',
  DEMO_TOOLS_ENABLED: process.env.DEMO_TOOLS_ENABLED === 'true',
};
