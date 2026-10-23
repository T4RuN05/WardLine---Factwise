import { app } from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';

async function start() {
  try {
    await connectDatabase();
    app.listen(env.PORT, () => {
      console.log(`[WardLine Server] Running on http://localhost:${env.PORT}`);
      console.log(`[WardLine Server] Facility Timezone: ${env.FACILITY_TIMEZONE}`);
      console.log(`[WardLine Server] Demo Mode: ${env.DEMO_MODE}`);
    });
  } catch (err) {
    console.error('[WardLine Server] Failed to start:', err);
    process.exit(1);
  }
}

start();
