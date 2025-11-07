const express = require('express');
const router = express.Router();
const User = require('../models/User');
const storageService = require('../services/storageService');
const crypto = require('crypto');

const { authenticateJWT, trackIP } = require('../middleware/auth');

// ============================================
// USER PROFILE ROUTES
// ============================================

router.get('/user/profile', authenticateJWT, trackIP, async (req, res) => {
  try {
    const user = req.user;
    
    // Initialize referral if it doesn't exist
    if (!user.referral) {
      user.referral = {
        code: null,
        referred_users: [],
        total_referrals: 0,
        total_credits_earned: 0
      };
    }
    
    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        
        subscription: {
          plan: user.subscription?.plan || 'free',
          status: user.subscription?.status || 'active',
          billing_cycle: user.subscription?.billing_cycle || null,
          started_at: user.subscription?.started_at || user.timestamps?.created_at,
          current_period_start: user.subscription?.current_period_start || null,
          current_period_end: user.subscription?.current_period_end || null,
          cancel_at_period_end: user.subscription?.cancel_at_period_end || false
        },
        
        // ⭐ NEW CREDIT STRUCTURE
        credits: {
          balance: user.credits?.balance || 20,
          monthly_allocation: user.credits?.monthly_allocation || 20,
          referral_credits: user.credits?.referral_credits || 0,
          next_reset_at: user.credits?.next_reset_at || new Date(),
          lifetime_earned: user.credits?.lifetime_earned || 20,
          lifetime_spent: user.credits?.lifetime_spent || 0
        },
        
        // ⭐ SIMPLIFIED USAGE
        usage: {
          summaries_this_week: user.usage?.summaries_this_week || 0,
          summaries_this_month: user.usage?.summaries_this_month || 0,
          total_summaries: user.usage?.total_summaries || 0,
          last_summary_at: user.usage?.last_summary_at || null,
          
          // ⭐ ONLY ONE LIMIT
          limits: {
            video_duration_seconds: user.usage?.limits?.video_duration_seconds || 1200
          },
          
          week_reset_at: user.usage?.week_reset_at || new Date()
        },
        
        features: {
          unlimited_summaries: user.features?.unlimited_summaries || false,
          unlimited_video_length: user.features?.unlimited_video_length || false,
          premium_ai_models: user.features?.premium_ai_models || false,
          export_summaries: user.features?.export_summaries || false,
          priority_support: user.features?.priority_support || false
        },
        
        // ⭐ ENHANCED REFERRAL DATA
        referral: {
          code: user.referral?.code || null,
          total_referrals: user.referral?.total_referrals || 0,
          total_credits_earned: user.referral?.total_credits_earned || 0
        },
        
        timestamps: {
          created_at: user.timestamps?.created_at || user.createdAt,
          last_login: user.timestamps?.last_login || new Date(),
          last_activity: user.timestamps?.last_activity || new Date()
        }
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// CREDITS MANAGEMENT
// ============================================

router.get('/credits/balance', authenticateJWT, async (req, res) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      credits: {
        balance: user.credits.balance,
        monthly_allocation: user.credits.monthly_allocation,
        referral_credits: user.credits.referral_credits,
        next_reset_at: user.credits.next_reset_at,
        lifetime_earned: user.credits.lifetime_earned,
        lifetime_spent: user.credits.lifetime_spent,
        plan: user.subscription.plan,
        is_premium: user.is_premium
      }
    });
  } catch (error) {
    console.error('Credit balance fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// VIDEO SUMMARY ROUTES (WITH EXTERNAL STORAGE)
// ============================================

// ⭐ NEW: Check cache in Supabase
router.post('/summary/check-cache', authenticateJWT, async (req, res) => {
  try {
    const { video_id } = req.body;
    
    const cached = await storageService.getSummary(video_id);
    
    if (cached) {
      res.json({
        success: true,
        cached: true,
        summary: cached
      });
    } else {
      res.json({
        success: true,
        cached: false,
        message: 'No cached summary found'
      });
    }
  } catch (error) {
    console.error('Cache check error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ⭐ UPDATED: Generate summary with external storage
router.post('/summary/generate', authenticateJWT, trackIP, async (req, res) => {
  try {
    const {
      video_id,
      video_title,
      video_url,
      video_duration,
      channel_name,
      ai_provider = 'openai',
      model_used = 'gpt-4',
      summary_length = 'medium'
    } = req.body;

    const user = req.user;

    // ⭐ Check for cached summary in Supabase first
    const cachedResult = await storageService.getSummary(video_id);
    
    if (cachedResult) {
      console.log('✅ Cache HIT! Returning cached summary');
      
      // Still deduct credit for free users (1 credit per summary)
      if (user.subscription.plan === 'free') {
        await user.deductCredits(1, 'Video summary (cached)', {
          video_id,
          video_title
        });
      }
      
      await user.logUsage({
        video_id,
        credits_used: user.subscription.plan === 'free' ? 1 : 0,
        success: true
      });
      
      return res.json({
        success: true,
        cached: true,
        summary: cachedResult.text,
        key_points: cachedResult.key_points,
        chapters: cachedResult.chapters,
        credits_remaining: user.credits.balance,
        usage: {
          summaries_this_week: user.usage.summaries_this_week,
          summaries_this_month: user.usage.summaries_this_month,
          total_summaries: user.usage.total_summaries
        }
      });
    }

    console.log('❌ Cache MISS! Generating new summary');

    // ⭐ Check if user can generate
    const canGenerate = user.canGenerateSummary(video_duration);
    if (!canGenerate.allowed) {
      return res.status(403).json({
        error: canGenerate.reason,
        credits_balance: user.credits.balance,
        next_reset: user.credits.next_reset_at
      });
    }

    // ⭐ Deduct 1 credit for free users
    if (user.subscription.plan === 'free') {
      await user.deductCredits(1, 'Video summary generated', {
        video_id,
        video_title,
        video_duration
      });
    }

    // Generate with AI
    const startTime = Date.now();
    const aiResponse = await generateSummaryWithAI({
      video_id,
      video_title,
      video_duration,
      provider: ai_provider,
      model: model_used,
      length: summary_length
    });
    const processingTime = Date.now() - startTime;

    // ⭐ Save to Supabase (external storage)
    await storageService.saveSummary(video_id, {
      text: aiResponse.summary,
      key_points: aiResponse.key_points || [],
      chapters: aiResponse.chapters || [],
      ai_provider,
      model: model_used,
      length: summary_length,
      word_count: aiResponse.summary.split(' ').length,
      processing_time: processingTime
    });

    // Log usage
    await user.logUsage({
      video_id,
      credits_used: user.subscription.plan === 'free' ? 1 : 0,
      success: true
    });

    user.timestamps.last_activity = new Date();
    await user.save();

    res.json({
      success: true,
      cached: false,
      summary: aiResponse.summary,
      key_points: aiResponse.key_points,
      chapters: aiResponse.chapters,
      credits_remaining: user.credits.balance,
      usage: {
        summaries_this_week: user.usage.summaries_this_week,
        summaries_this_month: user.usage.summaries_this_month,
        total_summaries: user.usage.total_summaries
      },
      processing_time: processingTime
    });

  } catch (error) {
    console.error('Summary generation error:', error);
    
    if (req.user) {
      await req.user.logUsage({
        video_id: req.body.video_id,
        success: false
      });
    }
    
    res.status(500).json({ error: 'Summary generation failed', message: error.message });
  }
});

// Mock AI function (replace with real AI integration)
async function generateSummaryWithAI(options) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    summary: `This is a ${options.length} summary of: ${options.video_title}. Generated using ${options.provider}.`,
    key_points: [
      'Key insight from the video content',
      'Important concept discussed in detail',
      'Main takeaway for viewers'
    ],
    chapters: [
      { title: 'Introduction', timestamp: '0:00', summary: 'Video overview' },
      { title: 'Main Discussion', timestamp: '3:15', summary: 'Core content' },
      { title: 'Conclusion', timestamp: '8:30', summary: 'Final thoughts' }
    ],
    tokens_used: 500,
    cost: 0.01
  };
}

// ⭐ SIMPLIFIED: Get recent usage history
router.get('/summary/history', authenticateJWT, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const user = req.user;

    const history = user.usage_logs
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    res.json({
      success: true,
      history,
      total: user.usage_logs.length
    });
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// REFERRAL ROUTES
// ============================================

// Generate referral code
router.post('/referral/generate', authenticateJWT, async (req, res) => {
  try {
    const user = req.user;
    
    const code = await user.generateReferralCode();
    
    res.json({
      success: true,
      referral_code: code,
      share_url: `${process.env.FRONTEND_URL}/signup?ref=${code}`
    });
  } catch (error) {
    console.error('Referral code generation error:', error);
    res.status(500).json({ error: 'Failed to generate referral code' });
  }
});

// Get referral stats
router.get('/referral/stats', authenticateJWT, async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      referral: {
        code: user.referral?.code || null,
        total_referrals: user.referral?.total_referrals || 0,
        total_credits_earned: user.referral?.total_credits_earned || 0,
        referred_users: user.referral?.referred_users || [],
        share_url: user.referral?.code 
          ? `${process.env.FRONTEND_URL}/signup?ref=${user.referral.code}`
          : null
      }
    });
  } catch (error) {
    console.error('Referral stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// SUBSCRIPTION ROUTES (STRIPE READY)
// ============================================

router.post('/subscription/upgrade', authenticateJWT, async (req, res) => {
  try {
    const { billing_cycle, stripe_data } = req.body;
    const user = req.user;

    const result = await user.upgradeSubscription('pro', billing_cycle, stripe_data);

    res.json({
      success: true,
      message: 'Upgraded to Pro!',
      previous_plan: result.previous_plan,
      new_plan: result.new_plan,
      features: user.features
    });
  } catch (error) {
    console.error('Upgrade error:', error);
    res.status(500).json({ error: 'Upgrade failed' });
  }
});

router.post('/subscription/cancel', authenticateJWT, async (req, res) => {
  try {
    const user = req.user;
    
    const result = await user.cancelSubscription();
    
    res.json(result);
  } catch (error) {
    console.error('Cancellation error:', error);
    res.status(500).json({ error: 'Cancellation failed' });
  }
});

// ============================================
// ADMIN ROUTES
// ============================================

// ⭐ NEW: Manual monthly credit reset trigger
router.post('/admin/reset-monthly-credits', async (req, res) => {
  try {
    const freeUsers = await User.find({
      'subscription.plan': 'free',
      'flags.is_active': true
    });

    let resetCount = 0;
    for (const user of freeUsers) {
      const now = new Date();
      if (now >= user.credits.next_reset_at) {
        await user.resetMonthlyCredits();
        resetCount++;
      }
    }

    res.json({
      success: true,
      message: `Reset credits for ${resetCount} users`
    });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ error: 'Reset failed' });
  }
});

// ⭐ NEW: Storage stats (Supabase)
router.get('/admin/storage-stats', async (req, res) => {
  try {
    const stats = await storageService.getStats();
    
    res.json({
      success: true,
      stats: {
        summaries_stored: stats.summaries,
        transcripts_stored: stats.transcripts,
        storage_provider: 'Supabase'
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// User stats
router.get('/admin/user-stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const freeUsers = await User.countDocuments({ 'subscription.plan': 'free' });
    const proUsers = await User.countDocuments({ 'subscription.plan': 'pro' });
    
    res.json({
      success: true,
      stats: {
        total_users: totalUsers,
        free_users: freeUsers,
        pro_users: proUsers
      }
    });
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;