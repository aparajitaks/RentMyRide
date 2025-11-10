// Simple daily scheduler for the archive job
// Runs at 02:00 server time every day.
const cron = require('node-cron');
const { main: runArchive } = require('./archive-messages');

async function start() {
  console.log('[archiver] Scheduler starting...');
  // Run once at startup (optional); comment out if undesired
  // await safeRun('startup');

  cron.schedule('0 2 * * *', async () => {
    await safeRun('scheduled');
  }, {
    scheduled: true,
    timezone: process.env.TZ || 'UTC',
  });

  console.log('[archiver] Scheduled daily at 02:00', { tz: process.env.TZ || 'UTC' });
}

async function safeRun(trigger) {
  const startedAt = new Date();
  console.log(`[archiver] Job trigger: ${trigger} at ${startedAt.toISOString()}`);
  try {
    await runArchive();
    console.log('[archiver] Job completed successfully');
  } catch (err) {
    console.error('[archiver] Job failed:', err && err.message ? err.message : err);
  }
}

if (require.main === module) {
  start().catch((e) => {
    console.error('[archiver] Scheduler failed to start', e);
    process.exit(1);
  });
}

module.exports = { start };
