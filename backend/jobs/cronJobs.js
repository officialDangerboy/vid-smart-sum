const User = require('../models/User');
const Video = require('../models/Video');

// Reset daily usage counters for all users (runs at midnight)
async function resetDailyUsage() {
  try {
    console.log('🔄 Starting daily usage reset...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const result = await User.updateMany(
      { 'flags.is_active': true },
      {
        $set: {
          'usage.summaries_today': 0,
          'usage.daily_reset_at': tomorrow
        }
      }
    );

    console.log(`✅ Daily usage reset for ${result.modifiedCount} users`);
    return result.modifiedCount;
  } catch (error) {
    console.error('❌ Daily reset error:', error);
    throw error;
  }
}

// Reset monthly credits for free users (runs daily, checks if needed)
async function resetMonthlyCredits() {
  try {
    console.log('🔄 Checking for monthly credit resets...');

    const now = new Date();

    // Find FREE users whose credits need reset
    const users = await User.find({
      'subscription.plan': 'free',
      'flags.is_active': true,
      'credits.next_reset_at': { $lte: now }
    });

    console.log(`📋 Found ${users.length} users needing credit reset`);

    let resetCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        await user.resetMonthlyCredits();
        console.log(`✅ Reset credits for: ${user.email} (${user.credits.balance} credits)`);
        resetCount++;
      } catch (error) {
        console.error(`❌ Error resetting credits for ${user.email}:`, error.message);
        errorCount++;
      }
    }

    console.log(`✅ Monthly credits reset: ${resetCount} success, ${errorCount} errors`);
    return { resetCount, errorCount };
  } catch (error) {
    console.error('❌ Monthly credit reset error:', error);
    throw error;
  }
}

// Clean up expired video cache (runs weekly)
async function cleanupExpiredCache() {
  try {
    console.log('🔄 Starting cache cleanup...');

    const deleted = await Video.cleanupExpiredCache();
    console.log(`✅ Cleaned up ${deleted} expired cache entries`);
    return deleted;
  } catch (error) {
    console.error('❌ Cache cleanup error:', error);
    throw error;
  }
}

// Notify users with low credits (< 10, only free users)
async function notifyLowCreditUsers() {
  try {
    console.log('🔄 Checking for low credit users...');

    const lowCreditUsers = await User.find({
      'subscription.plan': 'free',
      'flags.is_active': true,
      'credits.balance': { $lte: 10, $gt: 0 },
      'preferences.notifications.email.credit_low': true
    }).select('email name credits.balance credits.next_reset_at');

    console.log(`📧 Found ${lowCreditUsers.length} users with low credits`);

    // TODO: Integrate email service (SendGrid, Mailgun, Resend, etc.)
    for (const user of lowCreditUsers) {
      console.log(`Would send email to ${user.email} - ${user.credits.balance} credits remaining`);
      // Example:
      // await sendLowCreditEmail({
      //   to: user.email,
      //   name: user.name,
      //   creditsRemaining: user.credits.balance,
      //   nextReset: user.credits.next_reset_at
      // });
    }

    return lowCreditUsers.length;
  } catch (error) {
    console.error('❌ Low credit notification error:', error);
    throw error;
  }
}

// Generate weekly analytics (runs every Monday)
async function generateWeeklyAnalytics() {
  try {
    console.log('🔄 Generating weekly analytics...');

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [
      totalActiveUsers,
      newSignups,
      freeUsers,
      proUsers,
      summaryStats,
      cacheStats
    ] = await Promise.all([
      // Active users this week
      User.countDocuments({
        'flags.is_active': true,
        'timestamps.last_activity': { $gte: oneWeekAgo }
      }),

      // New signups
      User.countDocuments({
        'timestamps.created_at': { $gte: oneWeekAgo }
      }),

      // Free users count
      User.countDocuments({
        'subscription.plan': 'free',
        'flags.is_active': true
      }),

      // Pro users count
      User.countDocuments({
        'subscription.plan': 'pro',
        'subscription.status': 'active'
      }),

      // Summary statistics
      User.aggregate([
        {
          $match: {
            'usage.last_summary_at': { $gte: oneWeekAgo },
            'flags.is_active': true
          }
        },
        {
          $group: {
            _id: null,
            total_summaries: { $sum: '$usage.summaries_this_week' },
            total_videos: { $sum: '$usage.total_videos_watched' },
            total_time_saved: { $sum: '$usage.total_time_saved' }
          }
        }
      ]),

      // Cache hit statistics
      Video.aggregate([
        {
          $match: {
            'stats.last_accessed': { $gte: oneWeekAgo }
          }
        },
        {
          $group: {
            _id: null,
            total_cache_hits: { $sum: '$stats.cache_hit_count' },
            unique_videos: { $sum: 1 }
          }
        }
      ])
    ]);

    const stats = {
      period: 'week',
      generated_at: new Date(),
      users: {
        total_active: totalActiveUsers,
        new_signups: newSignups,
        free_users: freeUsers,
        pro_users: proUsers
      },
      summaries: {
        total: summaryStats[0]?.total_summaries || 0,
        unique_videos: cacheStats[0]?.unique_videos || 0,
        cache_hits: cacheStats[0]?.total_cache_hits || 0,
        videos_watched: summaryStats[0]?.total_videos || 0,
        time_saved_hours: Math.round((summaryStats[0]?.total_time_saved || 0) / 60)
      }
    };

    console.log('📊 Weekly Analytics:', JSON.stringify(stats, null, 2));

    // TODO: Store in analytics collection or send to admin dashboard
    // await Analytics.create(stats);

    return stats;
  } catch (error) {
    console.error('❌ Analytics generation error:', error);
    throw error;
  }
}

// Check for expired subscriptions (runs daily)
async function checkExpiredSubscriptions() {
  try {
    console.log('🔄 Checking for expired subscriptions...');

    const now = new Date();

    const expiredSubs = await User.find({
      'subscription.plan': 'pro',
      'subscription.status': 'active',
      'subscription.cancel_at_period_end': true,
      'subscription.current_period_end': { $lte: now }
    });

    console.log(`Found ${expiredSubs.length} expired subscriptions`);

    let downgradeCount = 0;

    for (const user of expiredSubs) {
      try {
        // Downgrade to free
        user.subscription.plan = 'free';
        user.subscription.status = 'expired';
        user.subscription.billing_cycle = null;

        // Reset features
        user.updateFeatureAccess();

        // Add transaction log
        user.credit_transactions.push({
          type: 'admin_adjustment',
          amount: 0,
          balance_after: user.credits.balance,
          description: 'Subscription expired - downgraded to free plan'
        });

        await user.save();

        console.log(`✅ Downgraded ${user.email} to free plan`);
        downgradeCount++;

        // TODO: Send email notification
        // await sendSubscriptionExpiredEmail(user);

      } catch (error) {
        console.error(`Error downgrading ${user.email}:`, error.message);
      }
    }

    console.log(`✅ Downgraded ${downgradeCount} expired subscriptions`);
    return downgradeCount;

  } catch (error) {
    console.error('❌ Check expired subscriptions error:', error);
    throw error;
  }
}

// Clean up old usage logs (runs monthly, keeps last 3 months)
async function cleanupOldLogs() {
  try {
    console.log('🔄 Cleaning up old logs...');

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const result = await User.updateMany(
      {},
      {
        $pull: {
          usage_logs: {
            timestamp: { $lt: threeMonthsAgo }
          },
          credit_transactions: {
            created_at: { $lt: threeMonthsAgo }
          }
        }
      }
    );

    console.log(`✅ Cleaned up old logs from ${result.modifiedCount} users`);
    return result.modifiedCount;

  } catch (error) {
    console.error('❌ Log cleanup error:', error);
    throw error;
  }
}

// Master function to run all cron jobs
async function runAllCronJobs() {
  console.log('🚀 Starting all cron jobs...\n');

  const results = {
    daily_reset: null,
    monthly_credits: null,
    cache_cleanup: null,
    low_credit_notifications: null,
    weekly_analytics: null,
    expired_subscriptions: null,
    old_logs_cleanup: null
  };

  try {
    results.daily_reset = await resetDailyUsage();
  } catch (error) {
    console.error('Daily reset failed:', error);
  }

  try {
    results.monthly_credits = await resetMonthlyCredits();
  } catch (error) {
    console.error('Monthly credits failed:', error);
  }

  try {
    results.cache_cleanup = await cleanupExpiredCache();
  } catch (error) {
    console.error('Cache cleanup failed:', error);
  }

  try {
    results.low_credit_notifications = await notifyLowCreditUsers();
  } catch (error) {
    console.error('Low credit notifications failed:', error);
  }

  try {
    results.weekly_analytics = await generateWeeklyAnalytics();
  } catch (error) {
    console.error('Weekly analytics failed:', error);
  }

  try {
    results.expired_subscriptions = await checkExpiredSubscriptions();
  } catch (error) {
    console.error('Expired subscriptions check failed:', error);
  }

  try {
    results.old_logs_cleanup = await cleanupOldLogs();
  } catch (error) {
    console.error('Old logs cleanup failed:', error);
  }

  console.log('\n✅ All cron jobs completed:', results);
  return results;
}

module.exports = {
  resetDailyUsage,
  resetMonthlyCredits,
  cleanupExpiredCache,
  notifyLowCreditUsers,
  generateWeeklyAnalytics,
  checkExpiredSubscriptions,
  cleanupOldLogs,
  runAllCronJobs
};