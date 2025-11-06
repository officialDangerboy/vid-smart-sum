const mongoose = require('mongoose');
const crypto = require('crypto');

// ============================================
// SUBDOCUMENT SCHEMAS
// ============================================

const creditTransactionSchema = new mongoose.Schema({
  transaction_id: {
    type: String,
    default: () => `txn_${crypto.randomBytes(16).toString('hex')}`
  },
  type: {
    type: String,
    enum: ['earned', 'spent', 'refund', 'bonus', 'purchase', 'expired', 'admin_adjustment'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  balance_after: {
    type: Number,
    required: true
  },
  description: String,
  metadata: {
    video_id: String,
    video_title: String,
    cached: Boolean,
    ai_provider: String
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const usageLogSchema = new mongoose.Schema({
  video_id: String,
  video_title: String,
  video_url: String,
  video_duration: Number,
  channel_name: String,
  ai_provider: {
    type: String,
    enum: ['openai', 'anthropic', 'google']
  },
  model_used: String,
  summary_length: {
    type: String,
    enum: ['short', 'medium', 'long']
  },
  credits_used: {
    type: Number,
    default: 1
  },
  processing_time: Number,
  success: {
    type: Boolean,
    default: true
  },
  error_message: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const referralSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    sparse: true
  },
  referred_users: [{
    user_id: mongoose.Schema.Types.ObjectId,
    email: String,
    signed_up_at: Date,
    credits_given: {
      type: Number,
      default: 0
    }
  }],
  total_referrals: {
    type: Number,
    default: 0
  },
  total_credits_earned: {
    type: Number,
    default: 0
  }
});

// ============================================
// MAIN USER SCHEMA
// ============================================

const userSchema = new mongoose.Schema({
  // Basic Info
  googleId: {
    type: String,
    required: true,
    unique: true,
    
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  picture: String,
  
  // Credits System
  credits: {
    balance: {
      type: Number,
      default: 100,
      min: 0
    },
    monthly_allocation: {
      type: Number,
      default: 100
    },
    last_reset: {
      type: Date,
      default: Date.now
    },
    next_reset_at: {
      type: Date,
      default: function() {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth;
      }
    },
    lifetime_earned: {
      type: Number,
      default: 100
    },
    lifetime_spent: {
      type: Number,
      default: 0
    },
    referral_credits: {
      type: Number,
      default: 0
    }
  },

  // Subscription
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'pro'],
      default: 'free',
      
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'expired', 'past_due'],
      default: 'active',
      
    },
    billing_cycle: {
      type: String,
      enum: ['monthly', 'yearly', null],
      default: null
    },
    started_at: {
      type: Date,
      default: Date.now
    },
    current_period_start: Date,
    current_period_end: Date,
    cancel_at_period_end: {
      type: Boolean,
      default: false
    },
    cancelled_at: Date,
    stripe_customer_id: {
      type: String,
      
    },
    stripe_subscription_id: {
      type: String,
      
    }
  },

  // Usage Tracking
  usage: {
    summaries_today: {
      type: Number,
      default: 0
    },
    summaries_this_week: {
      type: Number,
      default: 0
    },
    summaries_this_month: {
      type: Number,
      default: 0
    },
    total_summaries: {
      type: Number,
      default: 0
    },
    total_videos_watched: {
      type: Number,
      default: 0
    },
    total_time_saved: {
      type: Number,
      default: 0
    },
    last_summary_at: Date,
    
    limits: {
      daily_summaries: {
        type: Number,
        default: 30
      },
      monthly_summaries: {
        type: Number,
        default: 150
      },
      video_duration_seconds: {
        type: Number,
        default: 1200 // 20 minutes
      }
    },
    
    daily_reset_at: {
      type: Date,
      default: () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow;
      }
    }
  },

  // Preferences
  preferences: {
    ai: {
      default_provider: {
        type: String,
        enum: ['openai', 'anthropic', 'google'],
        default: 'openai'
      }
    },
    summary: {
      default_length: {
        type: String,
        enum: ['short', 'medium', 'long'],
        default: 'medium'
      }
    },
    notifications: {
      email: {
        credit_low: {
          type: Boolean,
          default: true
        },
        weekly_digest: {
          type: Boolean,
          default: false
        }
      }
    }
  },

  // Features
  features: {
    unlimited_summaries: {
      type: Boolean,
      default: false
    },
    unlimited_video_length: {
      type: Boolean,
      default: false
    },
    premium_ai_models: {
      type: Boolean,
      default: false
    },
    export_summaries: {
      type: Boolean,
      default: false
    },
    priority_support: {
      type: Boolean,
      default: false
    }
  },

  // Security
  security: {
    last_ip_address: String,
    ip_addresses: [{
      ip: String,
      timestamp: Date
    }]
  },

  // Flags
  flags: {
    is_active: {
      type: Boolean,
      default: true,
      
    },
    is_banned: {
      type: Boolean,
      default: false,
      
    },
    is_verified: {
      type: Boolean,
      default: true
    }
  },

  // Referral
  referral: referralSchema,

  // Transaction History
  credit_transactions: [creditTransactionSchema],
  usage_logs: [usageLogSchema],

  // Timestamps
  timestamps: {
    created_at: {
      type: Date,
      default: Date.now,
      immutable: true
    },
    updated_at: {
      type: Date,
      default: Date.now
    },
    last_login: {
      type: Date,
      default: Date.now
    },
    last_activity: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: { createdAt: 'timestamps.created_at', updatedAt: 'timestamps.updated_at' },
  collection: 'users'
});

// ============================================
// INDEXES
// ============================================
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ 'subscription.plan': 1, 'subscription.status': 1 });
userSchema.index({ 'flags.is_active': 1 });
userSchema.index({ 'credits.next_reset_at': 1 });
// ============================================
// VIRTUAL FIELDS
// ============================================

userSchema.virtual('is_premium').get(function() {
  return this.subscription.plan === 'pro';
});

userSchema.virtual('credit_percentage').get(function() {
  if (this.subscription.plan !== 'free') return 100;
  return (this.credits.balance / this.credits.monthly_allocation) * 100;
});

// ============================================
// INSTANCE METHODS
// ============================================

// Add credits
userSchema.methods.addCredits = async function(amount, type = 'earned', description = '', metadata = {}) {
  this.credits.balance += amount;
  this.credits.lifetime_earned += amount;
  
  if (type === 'earned') {
    this.credits.referral_credits += amount;
  }
  
  this.credit_transactions.push({
    type,
    amount,
    balance_after: this.credits.balance,
    description,
    metadata
  });
  
  // Keep only last 500 transactions
  if (this.credit_transactions.length > 500) {
    this.credit_transactions = this.credit_transactions.slice(-500);
  }
  
  await this.save();
  return this.credits.balance;
};

// Deduct credits
userSchema.methods.deductCredits = async function(amount, description = '', metadata = {}) {
  if (this.credits.balance < amount) {
    throw new Error('Insufficient credits');
  }
  
  this.credits.balance -= amount;
  this.credits.lifetime_spent += amount;
  
  this.credit_transactions.push({
    type: 'spent',
    amount: -amount,
    balance_after: this.credits.balance,
    description,
    metadata
  });
  
  await this.save();
  return this.credits.balance;
};

// Check if user can generate summary

userSchema.methods.canGenerateSummary = function(videoDuration = 0) {
  // Check account status first
  if (this.flags.is_banned) {
    return { allowed: false, reason: 'Account is banned' };
  }
  
  if (!this.flags.is_active) {
    return { allowed: false, reason: 'Account is inactive' };
  }
  
  // Premium users - unlimited access, skip all checks
  if (this.is_premium) {
    return { 
      allowed: true, 
      reason: 'Premium user - unlimited access',
      is_premium: true 
    };
  }
  
  // === FREE USER CHECKS BELOW ===
  
  // Check credits
  if (this.credits.balance < 1) {
    return { 
      allowed: false, 
      reason: 'Insufficient credits. You need at least 1 credit.',
      credits_remaining: this.credits.balance,
      next_reset: this.credits.next_reset_at
    };
  }
  
  // Check daily limit
  if (this.usage.summaries_today >= this.usage.limits.daily_summaries) {
    return { 
      allowed: false, 
      reason: `Daily limit of ${this.usage.limits.daily_summaries} summaries reached`,
      daily_limit: this.usage.limits.daily_summaries,
      summaries_today: this.usage.summaries_today,
      resets_at: this.usage.daily_reset_at
    };
  }
  
  // Check video duration limit
  if (videoDuration > this.usage.limits.video_duration_seconds) {
    const maxMinutes = Math.floor(this.usage.limits.video_duration_seconds / 60);
    return { 
      allowed: false, 
      reason: `Video exceeds ${maxMinutes} minute limit for free users`,
      video_duration_limit: maxMinutes,
      video_duration_provided: Math.floor(videoDuration / 60)
    };
  }
  
  // All checks passed for free user
  return { 
    allowed: true, 
    reason: 'Access granted',
    credits_remaining: this.credits.balance,
    daily_remaining: this.usage.limits.daily_summaries - this.usage.summaries_today
  };
};

// Log usage
userSchema.methods.logUsage = async function(usageData) {
  this.usage.summaries_today += 1;
  this.usage.summaries_this_month += 1;
  this.usage.total_summaries += 1;
  this.usage.last_summary_at = new Date();
  
  if (usageData.video_duration) {
    this.usage.total_videos_watched += 1;
    this.usage.total_time_saved += Math.floor(usageData.video_duration / 60);
  }
  
  this.usage_logs.push(usageData);
  
  // Keep only last 1000 logs
  if (this.usage_logs.length > 1000) {
    this.usage_logs = this.usage_logs.slice(-1000);
  }
  
  this.timestamps.last_activity = new Date();
  
  await this.save();
};

// Reset monthly credits
userSchema.methods.resetMonthlyCredits = async function() {
  if (this.subscription.plan === 'free') {
    const now = new Date();
    
    this.credits.balance = this.credits.monthly_allocation + this.credits.referral_credits;
    this.credits.last_reset = now;
    
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    this.credits.next_reset_at = nextMonth;
    
    this.credit_transactions.push({
      type: 'earned',
      amount: this.credits.monthly_allocation,
      balance_after: this.credits.balance,
      description: 'Monthly credit reset'
    });
    
    this.usage.summaries_this_month = 0;
    
    await this.save();
  }
};

// Upgrade subscription

// Upgrade or downgrade subscription
userSchema.methods.upgradeSubscription = async function(plan, billingCycle, stripeData = {}) {
  const previousPlan = this.subscription.plan;
  
  this.subscription.plan = plan;
  this.subscription.billing_cycle = billingCycle;
  this.subscription.status = 'active';
  this.subscription.started_at = new Date();
  
  if (stripeData.customerId) {
    this.subscription.stripe_customer_id = stripeData.customerId;
  }
  if (stripeData.subscriptionId) {
    this.subscription.stripe_subscription_id = stripeData.subscriptionId;
  }
  if (stripeData.currentPeriodStart) {
    this.subscription.current_period_start = stripeData.currentPeriodStart;
  }
  if (stripeData.currentPeriodEnd) {
    this.subscription.current_period_end = stripeData.currentPeriodEnd;
  }
  
  // Update features and limits based on new plan
  this.updateFeatureAccess();
  
  // Add transaction log
  this.credit_transactions.push({
    type: 'admin_adjustment',
    amount: 0,
    balance_after: this.credits.balance,
    description: `Subscription changed from ${previousPlan} to ${plan}`,
    metadata: {
      previous_plan: previousPlan,
      new_plan: plan,
      billing_cycle: billingCycle
    }
  });
  
  await this.save();
  
  return { 
    previous_plan: previousPlan, 
    new_plan: plan,
    features_updated: true
  };
};

// Update features based on subscription plan
userSchema.methods.updateFeatureAccess = function() {
  const plan = this.subscription.plan;
  
  if (plan === 'free') {
    // Free plan - limited features
    this.features.unlimited_summaries = false;
    this.features.unlimited_video_length = false;
    this.features.premium_ai_models = false;
    this.features.export_summaries = false;
    this.features.priority_support = false;
    
    // Reset limits for free users
    this.usage.limits.daily_summaries = 10;
    this.usage.limits.monthly_summaries = 300;
    this.usage.limits.video_duration_seconds = 1200; // 20 minutes
    
  } else if (plan === 'pro') {
    // Pro plan - all features enabled
    this.features.unlimited_summaries = true;
    this.features.unlimited_video_length = true;
    this.features.premium_ai_models = true;
    this.features.export_summaries = true;
    this.features.priority_support = true;
    
    // Remove limits for premium users
    this.usage.limits.daily_summaries = 999999; // Effectively unlimited
    this.usage.limits.monthly_summaries = 999999;
    this.usage.limits.video_duration_seconds = 999999; // No duration limit
  }
};

// Cancel subscription (downgrade to free at period end)
userSchema.methods.cancelSubscription = async function() {
  this.subscription.cancel_at_period_end = true;
  this.subscription.cancelled_at = new Date();
  
  this.credit_transactions.push({
    type: 'admin_adjustment',
    amount: 0,
    balance_after: this.credits.balance,
    description: 'Subscription cancelled - will downgrade at period end',
    metadata: {
      cancelled_at: this.subscription.cancelled_at,
      period_end: this.subscription.current_period_end
    }
  });
  
  await this.save();
  
  return {
    success: true,
    message: 'Subscription will be cancelled at period end',
    period_end: this.subscription.current_period_end
  };
};

// Update features
userSchema.methods.updateFeatureAccess = function() {
  const plan = this.subscription.plan;
  
  if (plan === 'free') {
    Object.keys(this.features.toObject()).forEach(feature => {
      this.features[feature] = false;
    });
  } else if (plan === 'pro') {
    this.features.unlimited_summaries = true;
    this.features.unlimited_video_length = true;
    this.features.premium_ai_models = true;
    this.features.export_summaries = true;
    this.features.priority_support = true;
  }
};

// Generate referral code
userSchema.methods.generateReferralCode = async function() {
  if (!this.referral.code) {
    const code = `REF${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    this.referral.code = code;
    await this.save();
  }
  return this.referral.code;
};

// ============================================
// MIDDLEWARE
// ============================================

userSchema.pre('save', function(next) {
  this.timestamps.updated_at = new Date();
  next();
});

// ============================================
// MODEL EXPORT
// ============================================

const User = mongoose.model('User', userSchema);

module.exports = User;