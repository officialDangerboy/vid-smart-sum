const cron = require('node-cron');
const {
  resetMonthlyCredits,
  resetWeeklyUsage,
  notifyLowCreditUsers,
  generateWeeklyAnalytics,
  checkExpiredSubscriptions,
  cleanupOldLogs
} = require('./cronJobs');

// Error logging helper
function logCronError(jobName, error) {
  console.error(`\n❌ [CRON ERROR] ${jobName} failed at ${new Date().toISOString()}`);
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}

// ============================================
// INITIALIZE ALL CRON JOBS
// ============================================

function initializeCronJobs() {
  console.log('⏰ Initializing cron jobs...\n');

  // ⭐ MONTHLY CREDIT RESET - 1st of each month at 00:00 UTC
  cron.schedule('0 0 1 * *', async () => {
    console.log('\n🗓️  [MONTHLY] Running monthly credit reset at', new Date().toISOString());
    try {
      await resetMonthlyCredits();
    } catch (error) {
      logCronError('Monthly Credit Reset', error);
    }
  }, {
    timezone: "UTC"
  });

  // ⭐ WEEKLY USAGE RESET - Every Monday at 00:00 UTC
  cron.schedule('0 0 * * 1', async () => {
    console.log('\n📊 [WEEKLY] Running weekly usage reset at', new Date().toISOString());
    try {
      await resetWeeklyUsage();
    } catch (error) {
      logCronError('Weekly Usage Reset', error);
    }
  }, {
    timezone: "UTC"
  });

  // DAILY: Check for expired subscriptions - Every day at 00:30 UTC
  cron.schedule('30 0 * * *', async () => {
    console.log('\n⏰ [DAILY] Checking expired subscriptions at', new Date().toISOString());
    try {
      await checkExpiredSubscriptions();
    } catch (error) {
      logCronError('Expired Subscriptions Check', error);
    }
  }, {
    timezone: "UTC"
  });

  // DAILY: Send low credit notifications - Every day at 09:00 UTC (morning)
  cron.schedule('0 9 * * *', async () => {
    console.log('\n🔔 [DAILY] Sending low credit notifications at', new Date().toISOString());
    try {
      await notifyLowCreditUsers();
    } catch (error) {
      logCronError('Low Credit Notifications', error);
    }
  }, {
    timezone: "UTC"
  });

  // WEEKLY: Generate analytics - Every Monday at 01:00 UTC
  cron.schedule('0 1 * * 1', async () => {
    console.log('\n📈 [WEEKLY] Generating weekly analytics at', new Date().toISOString());
    try {
      await generateWeeklyAnalytics();
    } catch (error) {
      logCronError('Weekly Analytics', error);
    }
  }, {
    timezone: "UTC"
  });

  // MONTHLY: Clean up old logs - 1st of each month at 02:00 UTC
  cron.schedule('0 2 1 * *', async () => {
    console.log('\n🗑️  [MONTHLY] Cleaning up old logs at', new Date().toISOString());
    try {
      await cleanupOldLogs();
    } catch (error) {
      logCronError('Log Cleanup', error);
    }
  }, {
    timezone: "UTC"
  });

  console.log('✅ All cron jobs scheduled successfully!\n');
  console.log('📅 Schedule (All times in UTC):');
  console.log('  - Monthly Credit Reset:    1st of month at 00:00');
  console.log('  - Weekly Usage Reset:      Every Monday at 00:00');
  console.log('  - Expired Subscriptions:   Every day at 00:30');
  console.log('  - Low Credit Alerts:       Every day at 09:00');
  console.log('  - Weekly Analytics:        Every Monday at 01:00');
  console.log('  - Old Logs Cleanup:        1st of month at 02:00\n');
}

// ============================================
// MANUAL TRIGGER FUNCTIONS (for testing)
// ============================================

const manualTriggers = {
  resetMonthly: async () => {
    console.log('🔧 Manual trigger: Monthly Credit Reset');
    return await resetMonthlyCredits();
  },
  resetWeekly: async () => {
    console.log('🔧 Manual trigger: Weekly Usage Reset');
    return await resetWeeklyUsage();
  },
  notifyLowCredits: async () => {
    console.log('🔧 Manual trigger: Low Credit Notifications');
    return await notifyLowCreditUsers();
  },
  generateAnalytics: async () => {
    console.log('🔧 Manual trigger: Weekly Analytics');
    return await generateWeeklyAnalytics();
  },
  checkExpired: async () => {
    console.log('🔧 Manual trigger: Expired Subscriptions');
    return await checkExpiredSubscriptions();
  },
  cleanupLogs: async () => {
    console.log('🔧 Manual trigger: Old Logs Cleanup');
    return await cleanupOldLogs();
  }
};

module.exports = {
  initializeCronJobs,
  manualTriggers
};