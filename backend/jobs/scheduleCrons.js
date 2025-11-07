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

// Error logging helper
function logCronError(jobName, error) {
  console.error(`\n❌ [CRON ERROR] ${jobName} failed at ${new Date().toISOString()}`);
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);

  // TODO: Send alert to admin (email, Slack, etc.)
  // await sendAdminAlert({ job: jobName, error: error.message });
}


cron.schedule('* * * * *', async () => {
  console.log('\n⏱️  [EVERY MINUTE] Running at', new Date().toISOString());
  try {
    // Your minute-by-minute logic here
    // Example: Check for pending urgent tasks
    await resetMonthlyCredits();
    await resetDailyUsage();


  } catch (error) {
    console.error('Every minute job failed:', error);
  }
}, {
  timezone: "UTC"
});

// Initialize all cron jobs
function initializeCronJobs() {
  console.log('⏰ Initializing cron jobs...\n');

  // Run every day at midnight (00:00 UTC)
  // Resets daily usage counters for all users
  cron.schedule('0 0 * * *', async () => {
    console.log('\n🕐 [DAILY] Running daily reset at', new Date().toISOString());
    try {
      await resetDailyUsage();
    } catch (error) {
      logCronError('Daily Reset', error);
    }
  }, {
    timezone: "UTC"
  });

  // Run every day at 1:00 AM UTC (FIXED - was running every hour!)
  // Checks and resets monthly credits for free users
  // cron.schedule('0 1 * * *', async () => {
  //   console.log('\n🕐 [DAILY] Running monthly credit check at', new Date().toISOString());
  //   try {
  //     await resetMonthlyCredits();
  //   } catch (error) {
  //     logCronError('Monthly Credit Reset', error);
  //   }
  // }, {
  //   timezone: "UTC"
  // });

  // Run every day at 2:00 AM UTC
  // Check for expired subscriptions and downgrade
  cron.schedule('0 2 * * *', async () => {
    console.log('\n🕐 [DAILY] Checking expired subscriptions at', new Date().toISOString());
    try {
      await checkExpiredSubscriptions();
    } catch (error) {
      logCronError('Expired Subscriptions Check', error);
    }
  }, {
    timezone: "UTC"
  });

  // Run every day at 3:00 AM UTC
  // Send low credit notifications to free users
  cron.schedule('0 3 * * *', async () => {
    console.log('\n🕐 [DAILY] Sending low credit notifications at', new Date().toISOString());
    try {
      await notifyLowCreditUsers();
    } catch (error) {
      logCronError('Low Credit Notifications', error);
    }
  }, {
    timezone: "UTC"
  });

  // Run every Sunday at 4:00 AM UTC
  // Clean up expired video cache
  cron.schedule('0 4 * * 0', async () => {
    console.log('\n🕐 [WEEKLY] Running cache cleanup at', new Date().toISOString());
    try {
      await cleanupExpiredCache();
    } catch (error) {
      logCronError('Cache Cleanup', error);
    }
  }, {
    timezone: "UTC"
  });

  // Run every Monday at 5:00 AM UTC
  // Generate weekly analytics
  cron.schedule('0 5 * * 1', async () => {
    console.log('\n🕐 [WEEKLY] Generating analytics at', new Date().toISOString());
    try {
      await generateWeeklyAnalytics();
    } catch (error) {
      logCronError('Weekly Analytics', error);
    }
  }, {
    timezone: "UTC"
  });

  // Run on 1st of every month at 6:00 AM UTC
  // Clean up old logs (keeps last 3 months)
  cron.schedule('0 6 1 * *', async () => {
    console.log('\n🕐 [MONTHLY] Cleaning up old logs at', new Date().toISOString());
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
  console.log('  - Daily Usage Reset:       Every day at 00:00');
  console.log('  - Monthly Credit Reset:    Every day at 01:00');
  console.log('  - Expired Subscriptions:   Every day at 02:00');
  console.log('  - Low Credit Alerts:       Every day at 03:00');
  console.log('  - Cache Cleanup:           Every Sunday at 04:00');
  console.log('  - Weekly Analytics:        Every Monday at 05:00');
  console.log('  - Old Logs Cleanup:        1st of month at 06:00\n');
}

// Manual trigger functions for testing
const manualTriggers = {
  resetDaily: async () => {
    console.log('🔧 Manual trigger: Daily Reset');
    return await resetDailyUsage();
  },
  resetMonthly: async () => {
    console.log('🔧 Manual trigger: Monthly Credit Reset');
    return await resetMonthlyCredits();
  },
  cleanupCache: async () => {
    console.log('🔧 Manual trigger: Cache Cleanup');
    return await cleanupExpiredCache();
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