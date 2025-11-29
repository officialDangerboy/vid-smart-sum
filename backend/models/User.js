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

// ✅ UPDATED: Fixed usageLogSchema
const usageLogSchema = new mongoose.Schema({
  video_id: String,
  video_title: String,
  video_url: String,
  video_duration: Number,
  channel_name: String,
  ai_provider: {
    type: String,
    enum: ['openai', 'anthropic', 'google', 'python_backend'],
    default: 'python_backend'
  },
  model_used: {
    type: String,
    default: 'python_backend'
  },
  summary_length: {
    type: String,
    enum: ['short', 'medium', 'detailed'],
    default: 'medium'
  },
  credits_used: {
    type: Number,
    default: 5  // ✅ CHANGED: Default to 5 credits per summary
  },
  processing_time: Number,
  cached: {
    type: Boolean,
    default: false
  },
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

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true
  },
  paymentId: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['created', 'authorized', 'captured', 'refunded', 'failed'],
    required: true
  },
  method: String,
  planType: {
    type: String,
    enum: ['pro_monthly', 'pro_yearly']
  },
  createdAt: {
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

const ipAddressSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// ============================================
// MAIN USER SCHEMA
// ============================================

const userSchema = new mongoose.Schema({
  // Basic Info
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  picture: String,
  
  // ✅ UPDATED: Credits System (50 credits signup, 5 per summary)
  credits: {
    balance: {
      type: Number,
      default: 50,  // ✅ CHANGED: 50 credits on signup
      min: 0
    },
    monthly_allocation: {
      type: Number,
      default: 50  // ✅ CHANGED: 50 credits per month
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
      default: 50  // ✅ CHANGED: Starting lifetime earned
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
      enum: ['free', 'pro', 'pro_monthly', 'pro_yearly'], // ✅ ADDED Razorpay plans
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
    
    // Stripe (keep for backward compatibility)
    stripe_customer_id: {
      type: String,
      unique: true,
      sparse: true
    },
    stripe_subscription_id: {
      type: String,
      unique: true,
      sparse: true
    },
    
    // ✅ NEW: Razorpay support
    razorpay_customer_id: {
      type: String,
      unique: true,
      sparse: true
    },
    razorpay_subscription_id: {
      type: String,
      unique: true,
      sparse: true
    },
    auto_renew: {
      type: Boolean,
      default: false
    }
  },

  // ✅ UPDATED: Usage Tracking (3 daily, 50 monthly limit)
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
        default: 3  // ✅ CHANGED: 3 summaries per day for free users
      },
      monthly_summaries: {
        type: Number,
        default: 50  // ✅ CHANGED: 50 summaries per month for free users
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

  // ✅ UPDATED: Preferences
  preferences: {
    ai: {
      default_provider: {
        type: String,
        enum: ['openai', 'anthropic', 'google', 'python_backend'],
        default: 'python_backend'
      }
    },
    summary: {
      default_length: {
        type: String,
        enum: ['short', 'medium', 'detailed'],
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
    ip_addresses: [ipAddressSchema],
    failed_login_attempts: {
      type: Number,
      default: 0
    },
    last_failed_login: Date,
    account_locked_until: Date
  },

  // Flags
  flags: {
    is_active: {
      type: Boolean,
      default: true
    },
    is_banned: {
      type: Boolean,
      default: false
    },
    is_verified: {
      type: Boolean,
      default: true
    },
    email_verified: {
      type: Boolean,
      default: true
    }
  },

  // Referral System
  referral: referralSchema,

  payments: [paymentSchema],

  // Transaction History
  credit_transactions: [creditTransactionSchema],

  // Usage Logs
  usage_logs: [usageLogSchema],

  // Timestamps
  timestamps: {
    created_at: {
      type: Date,
      default: Date.now
    },
    updated_at: {
      type: Date,
      default: Date.now
    },
    last_activity: {
      type: Date,
      default: Date.now
    },
    last_login: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: false,
  collection: 'users'
});

// ============================================
// VIRTUAL FIELDS
// ============================================

userSchema.virtual('is_premium').get(function() {
  // ✅ UPDATED: Include new Razorpay plans
  return this.subscription.plan === 'pro' || 
         this.subscription.plan === 'pro_monthly' || 
         this.subscription.plan === 'pro_yearly';
});

userSchema.virtual('credit_percentage').get(function() {
  if (this.subscription.plan !== 'free') return 100;
  return (this.credits.balance / this.credits.monthly_allocation) * 100;
});

// ============================================
// INSTANCE METHODS
// ============================================

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
  
  if (this.credit_transactions.length > 500) {
    this.credit_transactions = this.credit_transactions.slice(-500);
  }
  
  await this.save();
  return this.credits.balance;
};

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

// ✅ UPDATED: Check if user can generate summary (5 credits required, 3 daily, 50 monthly)
userSchema.methods.canGenerateSummary = function(videoDuration = 0) {
  if (this.flags.is_banned) {
    return { allowed: false, reason: 'Account is banned' };
  }
  
  if (!this.flags.is_active) {
    return { allowed: false, reason: 'Account is inactive' };
  }
  
  if (this.is_premium) {
    return { 
      allowed: true, 
      reason: 'Premium user - unlimited access',
      is_premium: true 
    };
  }
  
  // ✅ CHANGED: Check for 5 credits instead of 1
  if (this.credits.balance < 5) {
    return { 
      allowed: false, 
      reason: 'Insufficient credits. You need at least 5 credits to generate a summary.',
      credits_remaining: this.credits.balance,
      credits_required: 5,
      next_reset: this.credits.next_reset_at
    };
  }
  
  // ✅ Check daily limit (3 summaries per day)
  if (this.usage.summaries_today >= this.usage.limits.daily_summaries) {
    return { 
      allowed: false, 
      reason: `Daily limit of ${this.usage.limits.daily_summaries} summaries reached`,
      daily_limit: this.usage.limits.daily_summaries,
      summaries_today: this.usage.summaries_today,
      resets_at: this.usage.daily_reset_at
    };
  }
  
  // ✅ Check monthly limit (50 summaries per month)
  if (this.usage.summaries_this_month >= this.usage.limits.monthly_summaries) {
    return { 
      allowed: false, 
      reason: `Monthly limit of ${this.usage.limits.monthly_summaries} summaries reached`,
      monthly_limit: this.usage.limits.monthly_summaries,
      summaries_this_month: this.usage.summaries_this_month,
      next_reset: this.credits.next_reset_at
    };
  }
  
  if (videoDuration > this.usage.limits.video_duration_seconds) {
    const maxMinutes = Math.floor(this.usage.limits.video_duration_seconds / 60);
    return { 
      allowed: false, 
      reason: `Video exceeds ${maxMinutes} minute limit for free users`,
      video_duration_limit: maxMinutes,
      video_duration_provided: Math.floor(videoDuration / 60)
    };
  }
  
  return { 
    allowed: true, 
    reason: 'Access granted',
    credits_remaining: this.credits.balance,
    credits_required: 5,
    daily_remaining: this.usage.limits.daily_summaries - this.usage.summaries_today,
    monthly_remaining: this.usage.limits.monthly_summaries - this.usage.summaries_this_month
  };
};

// ✅ UPDATED: Log usage with 5 credits deduction
userSchema.methods.logUsage = async function(usageData) {
  this.usage.summaries_today += 1;
  this.usage.summaries_this_month += 1;
  this.usage.total_summaries += 1;
  this.usage.last_summary_at = new Date();
  
  if (usageData.video_duration) {
    this.usage.total_videos_watched += 1;
    this.usage.total_time_saved += Math.floor(usageData.video_duration / 60);
  }
  
  // Ensure all required fields have defaults
  this.usage_logs.push({
    video_id: usageData.video_id,
    video_title: usageData.video_title,
    video_url: usageData.video_url,
    video_duration: usageData.video_duration,
    channel_name: usageData.channel_name,
    ai_provider: usageData.ai_provider || 'python_backend',
    model_used: usageData.model_used || 'python_backend',
    summary_length: usageData.summary_length || 'medium',
    credits_used: usageData.credits_used || 5,  // ✅ CHANGED: Default to 5 credits
    processing_time: usageData.processing_time,
    cached: usageData.cached || false,
    success: usageData.success !== undefined ? usageData.success : true,
    error_message: usageData.error_message,
    timestamp: new Date()
  });
  
  if (this.usage_logs.length > 1000) {
    this.usage_logs = this.usage_logs.slice(-1000);
  }
  
  this.timestamps.last_activity = new Date();
  
  await this.save();
};

// ✅ UPDATED: Monthly reset with 50 credits
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

// ✅ UPDATED: Support Razorpay upgrades
userSchema.methods.upgradeSubscription = async function(plan, billingCycle, paymentData = {}) {
  const previousPlan = this.subscription.plan;
  
  this.subscription.plan = plan;
  this.subscription.billing_cycle = billingCycle;
  this.subscription.status = 'active';
  this.subscription.started_at = new Date();
  
  // Stripe support (backward compatibility)
  if (paymentData.stripeCustomerId) {
    this.subscription.stripe_customer_id = paymentData.stripeCustomerId;
  }
  if (paymentData.stripeSubscriptionId) {
    this.subscription.stripe_subscription_id = paymentData.stripeSubscriptionId;
  }
  
  // ✅ NEW: Razorpay support
  if (paymentData.razorpayCustomerId) {
    this.subscription.razorpay_customer_id = paymentData.razorpayCustomerId;
  }
  if (paymentData.razorpaySubscriptionId) {
    this.subscription.razorpay_subscription_id = paymentData.razorpaySubscriptionId;
  }
  
  if (paymentData.currentPeriodStart) {
    this.subscription.current_period_start = paymentData.currentPeriodStart;
  }
  if (paymentData.currentPeriodEnd) {
    this.subscription.current_period_end = paymentData.currentPeriodEnd;
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

// ✅ UPDATED: Support all plan types
userSchema.methods.updateFeatureAccess = function() {
  const plan = this.subscription.plan;
  
  // Free plan
  if (plan === 'free') {
    this.features.unlimited_summaries = false;
    this.features.unlimited_video_length = false;
    this.features.premium_ai_models = false;
    this.features.export_summaries = false;
    this.features.priority_support = false;
    
    this.usage.limits.daily_summaries = 3;
    this.usage.limits.monthly_summaries = 50;
    this.usage.limits.video_duration_seconds = 1200;
  } 
  // Pro plans (all variants)
  else if (plan === 'pro' || plan === 'pro_monthly' || plan === 'pro_yearly') {
    this.features.unlimited_summaries = true;
    this.features.unlimited_video_length = true;
    this.features.premium_ai_models = true;
    this.features.export_summaries = true;
    this.features.priority_support = true;
    
    this.usage.limits.daily_summaries = 999999;
    this.usage.limits.monthly_summaries = 999999;
    this.usage.limits.video_duration_seconds = 999999;
  }
};

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

userSchema.methods.generateReferralCode = async function() {
  if (this.referral && this.referral.code) {
    console.log('📌 Referral code already exists:', this.referral.code);
    return this.referral.code;
  }

  console.log('🔄 Generating new referral code for user:', this._id);

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
      console.log('✅ Referral code generated and saved:', updated.referral.code);
      return updated.referral.code;
    }

    console.log('⚠️ Code already set by another process, fetching...');
    const freshUser = await mongoose.model('User').findById(this._id);
    
    if (freshUser && freshUser.referral && freshUser.referral.code) {
      this.referral = this.referral || {};
      this.referral.code = freshUser.referral.code;
      console.log('✅ Using existing code from DB:', freshUser.referral.code);
      return freshUser.referral.code;
    }

    console.error('❌ Failed to generate or fetch referral code');
    return null;

  } catch (error) {
    console.error('❌ Error in generateReferralCode:', error);
    
    const freshUser = await mongoose.model('User').findById(this._id);
    if (freshUser && freshUser.referral && freshUser.referral.code) {
      this.referral.code = freshUser.referral.code;
      return freshUser.referral.code;
    }
    
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
// INDEXES FOR PERFORMANCE
// ============================================

userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ 'subscription.plan': 1 });
userSchema.index({ 'subscription.stripe_customer_id': 1 });
userSchema.index({ 'timestamps.created_at': -1 });
userSchema.index({ 'referral.code': 1 }, { 
  unique: true, 
  sparse: true 
});

// ============================================
// MODEL EXPORT
// ============================================

const User = mongoose.model('User', userSchema);

module.exports = User;