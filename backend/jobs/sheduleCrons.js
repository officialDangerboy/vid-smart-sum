const cron = require('node-cron');
const {
  resetDailyUsage,
  resetMonthlyCredits,
  cleanupExpiredCache,
  notifyLowCreditUsers,
  generateWeeklyAnalytics,
  checkExpiredSubscriptions,
  cleanupOldLogs
} = require('./cronJobs');

// Initialize all cron jobs
function initializeCronJobs() {
  console.log('⏰ Initializing cron jobs...\n');

  // Run every day at midnight (00:00)
  // Resets daily usage counters for all users
  cron.schedule('0 0 * * *', async () => {
    console.log('\n🕐 [DAILY] Running daily reset at', new Date().toISOString());
    try {
      await resetDailyUsage();
    } catch (error) {
      console.error('Daily reset failed:', error);
    }
  }, {
    timezone: "UTC"
  });

  // Run every day at 1:00 AM
  // Checks and resets monthly credits for free users
  cron.schedule('0 1 * * *', async () => {
    console.log('\n🕐 [DAILY] Running monthly credit check at', new Date().toISOString());
    try {
      await resetMonthlyCredits();
    } catch (error) {
      console.error('Monthly credit check failed:', error);
    }
  }, {
    timezone: "UTC"
  });

  // Run every day at 2:00 AM
  // Check for expired subscriptions and downgrade
  cron.schedule('0 2 * * *', async () => {
    console.log('\n🕐 [DAILY] Checking expired subscriptions at', new Date().toISOString());
    try {
      await checkExpiredSubscriptions();
    } catch (error) {
      console.error('Expired subscription check failed:', error);
    }
  }, {
    timezone: "UTC"
  });

  // Run every day at 3:00 AM
  // Send low credit notifications to free users
  cron.schedule('0 3 * * *', async () => {
    console.log('\n🕐 [DAILY] Sending low credit notifications at', new Date().toISOString());
    try {
      await notifyLowCreditUsers();
    } catch (error) {
      console.error('Low credit notifications failed:', error);
    }
  }, {
    timezone: "UTC"
  });

  // Run every Sunday at 4:00 AM
  // Clean up expired video cache
  cron.schedule('0 4 * * 0', async () => {
    console.log('\n🕐 [WEEKLY] Running cache cleanup at', new Date().toISOString());
    try {
      await cleanupExpiredCache();
    } catch (error) {
      console.error('Cache cleanup failed:', error);
    }
  }, {
    timezone: "UTC"
  });

  // Run every Monday at 5:00 AM
  // Generate weekly analytics
  cron.schedule('0 5 * * 1', async () => {
    console.log('\n🕐 [WEEKLY] Generating analytics at', new Date().toISOString());
    try {
      await generateWeeklyAnalytics();
    } catch (error) {
      console.error('Weekly analytics failed:', error);
    }
  }, {
    timezone: "UTC"
  });

  // Run on 1st of every month at 6:00 AM
  // Clean up old logs (keeps last 3 months)
  cron.schedule('0 6 1 * *', async () => {
    console.log('\n🕐 [MONTHLY] Cleaning up old logs at', new Date().toISOString());
    try {
      await cleanupOldLogs();
    } catch (error) {
      console.error('Log cleanup failed:', error);
    }
  }, {
    timezone: "UTC"
  });

  console.log('✅ All cron jobs scheduled successfully!\n');
  console.log('📅 Schedule:');
  console.log('  - Daily Usage Reset:       Every day at 00:00 UTC');
  console.log('  - Monthly Credit Reset:    Every day at 01:00 UTC');
  console.log('  - Expired Subscriptions:   Every day at 02:00 UTC');
  console.log('  - Low Credit Alerts:       Every day at 03:00 UTC');
  console.log('  - Cache Cleanup:           Every Sunday at 04:00 UTC');
  console.log('  - Weekly Analytics:        Every Monday at 05:00 UTC');
  console.log('  - Old Logs Cleanup:        1st of month at 06:00 UTC\n');
}

// Manual trigger functions for testing
const manualTriggers = {
  resetDaily: () => resetDailyUsage(),
  resetMonthly: () => resetMonthlyCredits(),
  cleanupCache: () => cleanupExpiredCache(),
  notifyLowCredits: () => notifyLowCreditUsers(),
  generateAnalytics: () => generateWeeklyAnalytics(),
  checkExpired: () => checkExpiredSubscriptions(),
  cleanupLogs: () => cleanupOldLogs()
};

module.exports = {
  initializeCronJobs,
  manualTriggers
};