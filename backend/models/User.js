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
    enum: ['earned', 'spent', 'refund', 'bonus', 'purchase', 'expired', 'admin_adjustment', 'referral', 'monthly_reset'],
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
    referral_user_id: String,
    referral_user_email: String
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

// Lightweight usage log - only essential data
const usageLogSchema = new mongoose.Schema({
  video_id: String,
  credits_used: {
    type: Number,
    default: 1
  },
  success: {
    type: Boolean,
    default: true
  },
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
    index: true
  },
  email: {
    type: String,
    required: true,
    index: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  picture: String,
  
  // ⭐ NEW CREDITS SYSTEM
  credits: {
    balance: {
      type: Number,
      default: 20, // Changed from 100 to 20
      min: 0
    },
    monthly_allocation: {
      type: Number,
      default: 20 // Changed from 100 to 20
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
        nextMonth.setDate(1); // First day of next month
        nextMonth.setHours(0, 0, 0, 0);
        return nextMonth;
      }
    },
    lifetime_earned: {
      type: Number,
      default: 20 // Initial signup bonus
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
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'expired', 'past_due'],
      default: 'active'
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
      unique: true,
      sparse: true
    },
    stripe_subscription_id: {
      type: String,
      unique: true,
      sparse: true
    }
  },

  // ⭐ SIMPLIFIED USAGE TRACKING
  usage: {
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
    last_summary_at: Date,
    
    // ⭐ ONLY ONE LIMIT NOW
    limits: {
      video_duration_seconds: {
        type: Number,
        default: 1200 // 20 minutes for free users
      }
    },
    
    // Track weekly reset
    week_reset_at: {
      type: Date,
      default: () => {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        nextWeek.setHours(0, 0, 0, 0);
        return nextWeek;
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
        monthly_reset: {
          type: Boolean,
          default: true
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

  // ⭐ ENHANCED REFERRAL SYSTEM
  referral: referralSchema,

  // Transaction history (keep last 100 for performance)
  credit_transactions: [creditTransactionSchema],
  
  // Simplified usage logs (keep last 50)
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
  },

  // Flags
  flags: {
    is_active: {
      type: Boolean,
      default: true
    },
    email_verified: {
      type: Boolean,
      default: true
    },
    is_banned: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: { createdAt: 'timestamps.created_at', updatedAt: 'timestamps.updated_at' }
});

// ============================================
// VIRTUAL FIELDS
// ============================================

userSchema.virtual('is_premium').get(function() {
  return this.subscription?.plan === 'pro' && this.subscription?.status === 'active';
});

userSchema.virtual('credits_percentage').get(function() {
  if (this.is_premium) return 100;
  return Math.round((this.credits.balance / this.credits.monthly_allocation) * 100);
});

// ============================================
// INSTANCE METHODS
// ============================================

// ⭐ SIMPLIFIED: Check if user can generate summary
userSchema.methods.canGenerateSummary = function(videoDuration = 0) {
  // Premium users - unlimited
  if (this.is_premium) {
    return {
      allowed: true,
      reason: 'Premium user - unlimited access',
      is_premium: true
    };
  }
  
  // === FREE USER CHECKS ===
  
  // Check credits
  if (this.credits.balance < 1) {
    return {
      allowed: false,
      reason: 'Insufficient credits. You need at least 1 credit.',
      credits_remaining: this.credits.balance,
      next_reset: this.credits.next_reset_at
    };
  }
  
  // ⭐ ONLY CHECK: Video duration limit (20 minutes)
  if (videoDuration > this.usage.limits.video_duration_seconds) {
    const maxMinutes = Math.floor(this.usage.limits.video_duration_seconds / 60);
    return {
      allowed: false,
      reason: `Video exceeds ${maxMinutes} minute limit for free users`,
      video_duration_limit: maxMinutes,
      video_duration_provided: Math.floor(videoDuration / 60)
    };
  }
  
  // All checks passed
  return {
    allowed: true,
    reason: 'Access granted',
    credits_remaining: this.credits.balance
  };
};

// Deduct credits
userSchema.methods.deductCredits = async function(amount, description, metadata = {}) {
  if (this.is_premium) {
    console.log('⭐ Premium user - no credits deducted');
    return;
  }
  
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
  
  // Keep only last 100 transactions
  if (this.credit_transactions.length > 100) {
    this.credit_transactions = this.credit_transactions.slice(-100);
  }
  
  await this.save();
  
  console.log(`💳 Deducted ${amount} credits from ${this.email}. Balance: ${this.credits.balance}`);
};

// Add credits
userSchema.methods.addCredits = async function(amount, type, description, metadata = {}) {
  this.credits.balance += amount;
  this.credits.lifetime_earned += amount;
  
  this.credit_transactions.push({
    type,
    amount,
    balance_after: this.credits.balance,
    description,
    metadata
  });
  
  // Keep only last 100 transactions
  if (this.credit_transactions.length > 100) {
    this.credit_transactions = this.credit_transactions.slice(-100);
  }
  
  await this.save();
  
  console.log(`💰 Added ${amount} credits to ${this.email}. Balance: ${this.credits.balance}`);
};

// ⭐ NEW: Add referral credits with tiered rewards (10/7/5)
userSchema.methods.addReferralCredits = async function(newUser) {
  const referralCount = this.referral.total_referrals;
  let creditsToGive = 5; // Default for 3rd+ referrals
  
  // ⭐ TIERED REWARDS
  if (referralCount === 0) {
    creditsToGive = 10; // First referral
  } else if (referralCount === 1) {
    creditsToGive = 7; // Second referral
  }
  
  // Add credits
  this.credits.balance += creditsToGive;
  this.credits.referral_credits += creditsToGive;
  this.credits.lifetime_earned += creditsToGive;
  
  // Track referral
  this.referral.referred_users.push({
    user_id: newUser._id,
    email: newUser.email,
    signed_up_at: new Date(),
    credits_given: creditsToGive
  });
  
  this.referral.total_referrals += 1;
  this.referral.total_credits_earned += creditsToGive;
  
  // Add transaction
  this.credit_transactions.push({
    type: 'referral',
    amount: creditsToGive,
    balance_after: this.credits.balance,
    description: `Referral bonus for inviting ${newUser.email}`,
    metadata: {
      referral_user_id: newUser._id.toString(),
      referral_user_email: newUser.email
    }
  });
  
  await this.save();
  
  console.log(`🎁 Referral credits: ${creditsToGive} credits given to ${this.email} (Referral #${referralCount + 1})`);
  
  return { creditsGiven: creditsToGive, totalReferrals: this.referral.total_referrals };
};

// ⭐ SIMPLIFIED: Log usage
userSchema.methods.logUsage = async function(usageData) {
  this.usage.summaries_this_week += 1;
  this.usage.summaries_this_month += 1;
  this.usage.total_summaries += 1;
  this.usage.last_summary_at = new Date();
  
  this.usage_logs.push({
    video_id: usageData.video_id,
    credits_used: usageData.credits_used || 1,
    success: usageData.success !== undefined ? usageData.success : true,
    timestamp: new Date()
  });
  
  // Keep only last 50 logs
  if (this.usage_logs.length > 50) {
    this.usage_logs = this.usage_logs.slice(-50);
  }
  
  this.timestamps.last_activity = new Date();
  
  await this.save();
};

// ⭐ MONTHLY RESET (runs on 1st of each month)
userSchema.methods.resetMonthlyCredits = async function() {
  if (this.subscription.plan === 'free') {
    const now = new Date();
    
    this.credits.balance = this.credits.monthly_allocation + this.credits.referral_credits;
    this.credits.last_reset = now;
    
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    nextMonth.setHours(0, 0, 0, 0);
    this.credits.next_reset_at = nextMonth;
    
    this.credit_transactions.push({
      type: 'monthly_reset',
      amount: this.credits.monthly_allocation,
      balance_after: this.credits.balance,
      description: 'Monthly credit reset'
    });
    
    this.usage.summaries_this_month = 0;
    
    await this.save();
    
    console.log(`📅 Monthly reset: ${this.credits.monthly_allocation} credits for ${this.email}`);
  }
};

// ⭐ WEEKLY RESET (for tracking weekly usage)
userSchema.methods.resetWeeklyUsage = async function() {
  const now = new Date();
  
  this.usage.summaries_this_week = 0;
  
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(0, 0, 0, 0);
  this.usage.week_reset_at = nextWeek;
  
  await this.save();
  
  console.log(`📊 Weekly reset for ${this.email}`);
};

// Upgrade subscription
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
  
  this.updateFeatureAccess();
  
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

// Update features based on plan
userSchema.methods.updateFeatureAccess = function() {
  const plan = this.subscription.plan;
  
  if (plan === 'free') {
    this.features.unlimited_summaries = false;
    this.features.unlimited_video_length = false;
    this.features.premium_ai_models = false;
    this.features.export_summaries = false;
    this.features.priority_support = false;
    
    this.usage.limits.video_duration_seconds = 1200; // 20 minutes
  } else if (plan === 'pro') {
    this.features.unlimited_summaries = true;
    this.features.unlimited_video_length = true;
    this.features.premium_ai_models = true;
    this.features.export_summaries = true;
    this.features.priority_support = true;
    
    this.usage.limits.video_duration_seconds = 999999; // No limit
  }
};

// Cancel subscription
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

// Generate referral code
userSchema.methods.generateReferralCode = async function() {
  if (this.referral && this.referral.code) {
    return this.referral.code;
  }

  const newCode = `REF${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

  try {
    const updated = await mongoose.model('User').findOneAndUpdate(
      {
        _id: this._id,
        $or: [
          { 'referral.code': { $exists: false } },
          { 'referral.code': null },
          { 'referral.code': '' }
        ]
      },
      {
        $set: {
          'referral.code': newCode,
          'referral.total_referrals': 0,
          'referral.total_credits_earned': 0,
          'referral.referred_users': []
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (updated && updated.referral && updated.referral.code) {
      this.referral = this.referral || {};
      this.referral.code = updated.referral.code;
      return updated.referral.code;
    }

    const freshUser = await mongoose.model('User').findById(this._id);
    if (freshUser && freshUser.referral && freshUser.referral.code) {
      this.referral = this.referral || {};
      this.referral.code = freshUser.referral.code;
      return freshUser.referral.code;
    }

    return null;
  } catch (error) {
    console.error('❌ Error in generateReferralCode:', error);
    throw error;
  }
};

// ============================================
// MIDDLEWARE
// ============================================

userSchema.pre('save', function(next) {
  this.timestamps.updated_at = new Date();
  next();
});

// ============================================
// INDEXES
// ============================================

// Only keep unique indexes here (fields already have index: true in schema)
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ googleId: 1 }, { unique: true });
userSchema.index({ 'subscription.stripe_customer_id': 1 }, { unique: true, sparse: true });
userSchema.index({ 'referral.code': 1 }, { unique: true, sparse: true });

// Regular indexes
userSchema.index({ 'subscription.plan': 1 });
userSchema.index({ 'timestamps.created_at': -1 });

// ============================================
// MODEL EXPORT
// ============================================

const User = mongoose.model('User', userSchema);

module.exports = User;