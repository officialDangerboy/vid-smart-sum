const User = require('../models/User');

// ============================================
// ⭐ MONTHLY CREDIT RESET (1st of each month)
// ============================================

async function resetMonthlyCredits() {
  console.log('\n📅 [CRON] Running monthly credit reset...');
  
  try {
    const now = new Date();
    
    // Find all free users whose next reset date has passed
    const freeUsers = await User.find({
      'subscription.plan': 'free',
      'flags.is_active': true,
      'credits.next_reset_at': { $lte: now }
    });
    
    console.log(`Found ${freeUsers.length} users due for monthly reset`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const user of freeUsers) {
      try {
        await user.resetMonthlyCredits();
        successCount++;
      } catch (error) {
        console.error(`Failed to reset credits for ${user.email}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`✅ Monthly reset complete: ${successCount} success, ${errorCount} errors`);
    
    return {
      success: true,
      usersReset: successCount,
      errors: errorCount
    };
    
  } catch (error) {
    console.error('❌ Monthly credit reset failed:', error);
    throw error;
  }
}

// ============================================
// ⭐ WEEKLY USAGE RESET
// ============================================

async function resetWeeklyUsage() {
  console.log('\n📊 [CRON] Running weekly usage reset...');
  
  try {
    const now = new Date();
    
    // Find all users whose week reset date has passed
    const users = await User.find({
      'flags.is_active': true,
      'usage.week_reset_at': { $lte: now }
    });
    
    console.log(`Found ${users.length} users due for weekly reset`);
    
    let successCount = 0;
    
    for (const user of users) {
      try {
        await user.resetWeeklyUsage();
        successCount++;
      } catch (error) {
        console.error(`Failed to reset weekly usage for ${user.email}:`, error.message);
      }
    }
    
    console.log(`✅ Weekly usage reset complete: ${successCount} users updated`);
    
    return {
      success: true,
      usersReset: successCount
    };
    
  } catch (error) {
    console.error('❌ Weekly usage reset failed:', error);
    throw error;
  }
}

// ============================================
// LOW CREDIT NOTIFICATIONS
// ============================================

async function notifyLowCreditUsers() {
  console.log('\n🔔 [CRON] Checking for low credit users...');
  
  try {
    // Find free users with 5 or fewer credits
    const lowCreditUsers = await User.find({
      'subscription.plan': 'free',
      'flags.is_active': true,
      'credits.balance': { $lte: 5, $gt: 0 },
      'preferences.notifications.email.credit_low': true
    });
    
    console.log(`Found ${lowCreditUsers.length} users with low credits`);
    
    // TODO: Send email notifications
    // for (const user of lowCreditUsers) {
    //   await sendLowCreditEmail(user);
    // }
    
    return {
      success: true,
      usersNotified: lowCreditUsers.length
    };
    
  } catch (error) {
    console.error('❌ Low credit notification failed:', error);
    throw error;
  }
}

// ============================================
// WEEKLY ANALYTICS
// ============================================

async function generateWeeklyAnalytics() {
  console.log('\n📈 [CRON] Generating weekly analytics...');
  
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // Calculate stats
    const totalUsers = await User.countDocuments({ 'flags.is_active': true });
    const newUsers = await User.countDocuments({
      'timestamps.created_at': { $gte: oneWeekAgo }
    });
    
    const freeUsers = await User.countDocuments({ 
      'subscription.plan': 'free',
      'flags.is_active': true 
    });
    
    const proUsers = await User.countDocuments({ 
      'subscription.plan': 'pro',
      'flags.is_active': true 
    });
    
    // Calculate total summaries this week
    const users = await User.find({ 'flags.is_active': true });
    let totalSummariesThisWeek = 0;
    
    for (const user of users) {
      totalSummariesThisWeek += user.usage?.summaries_this_week || 0;
    }
    
    const analytics = {
      week_ending: new Date(),
      total_users: totalUsers,
      new_users: newUsers,
      free_users: freeUsers,
      pro_users: proUsers,
      total_summaries_this_week: totalSummariesThisWeek
    };
    
    console.log('📊 Weekly Analytics:', analytics);
    
    // TODO: Save to analytics collection or send to admin
    
    return {
      success: true,
      analytics
    };
    
  } catch (error) {
    console.error('❌ Weekly analytics generation failed:', error);
    throw error;
  }
}

// ============================================
// EXPIRED SUBSCRIPTIONS CHECK
// ============================================

async function checkExpiredSubscriptions() {
  console.log('\n⏰ [CRON] Checking for expired subscriptions...');
  
  try {
    const now = new Date();
    
    // Find Pro users whose subscription has ended
    const expiredUsers = await User.find({
      'subscription.plan': 'pro',
      'subscription.current_period_end': { $lte: now },
      'subscription.cancel_at_period_end': true
    });
    
    console.log(`Found ${expiredUsers.length} expired subscriptions`);
    
    let downgradeCount = 0;
    
    for (const user of expiredUsers) {
      try {
        // Downgrade to free
        user.subscription.plan = 'free';
        user.subscription.status = 'expired';
        user.subscription.cancel_at_period_end = false;
        
        // Update features
        user.updateFeatureAccess();
        
        // Reset credits to monthly allocation
        user.credits.balance = user.credits.monthly_allocation;
        
        await user.save();
        
        console.log(`✅ Downgraded ${user.email} to free plan`);
        downgradeCount++;
        
        // TODO: Send email notification about downgrade
        
      } catch (error) {
        console.error(`Failed to downgrade ${user.email}:`, error.message);
      }
    }
    
    console.log(`✅ Expired subscription check complete: ${downgradeCount} users downgraded`);
    
    return {
      success: true,
      usersDowngraded: downgradeCount
    };
    
  } catch (error) {
    console.error('❌ Expired subscription check failed:', error);
    throw error;
  }
}

// ============================================
// CLEANUP OLD LOGS (Keep last 3 months)
// ============================================

async function cleanupOldLogs() {
  console.log('\n🗑️  [CRON] Cleaning up old logs...');
  
  try {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    // Clean up old credit transactions and usage logs
    const users = await User.find({ 'flags.is_active': true });
    
    let cleanedCount = 0;
    
    for (const user of users) {
      let modified = false;
      
      // Keep only transactions from last 3 months
      if (user.credit_transactions && user.credit_transactions.length > 0) {
        const oldLength = user.credit_transactions.length;
        user.credit_transactions = user.credit_transactions.filter(
          tx => tx.created_at >= threeMonthsAgo
        );
        
        if (user.credit_transactions.length < oldLength) {
          modified = true;
        }
      }
      
      // Keep only usage logs from last 3 months
      if (user.usage_logs && user.usage_logs.length > 0) {
        const oldLength = user.usage_logs.length;
        user.usage_logs = user.usage_logs.filter(
          log => log.timestamp >= threeMonthsAgo
        );
        
        if (user.usage_logs.length < oldLength) {
          modified = true;
        }
      }
      
      if (modified) {
        await user.save();
        cleanedCount++;
      }
    }
    
    console.log(`✅ Log cleanup complete: ${cleanedCount} users cleaned`);
    
    return {
      success: true,
      usersCleaned: cleanedCount
    };
    
  } catch (error) {
    console.error('❌ Log cleanup failed:', error);
    throw error;
  }
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  resetMonthlyCredits,
  resetWeeklyUsage,
  notifyLowCreditUsers,
  generateWeeklyAnalytics,
  checkExpiredSubscriptions,
  cleanupOldLogs
};