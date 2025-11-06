const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Video = require('../models/Video');
const crypto = require('crypto');

// Import JWT middleware (NOT session-based)
const { authenticateJWT, trackIP } = require('../middleware/auth');

// Encryption helper functions
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
const IV_LENGTH = 16;

function encryptApiKey(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decryptApiKey(text) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// ============================================
// USER PROFILE ROUTES
// ============================================

// Get full user profile with all stats
router.get('/user/profile', authenticateJWT, trackIP, async (req, res) => {
  try {
    const user = req.user; // Already fetched by authenticateJWT
    
    // Initialize referral if it doesn't exist
    if (!user.referral) {
      user.referral = {
        code: null,
        referred_users: [],
        total_referrals: 0,
        total_credits_earned: 0
      };
    }
    
    // Generate referral code if doesn't exist - FIXED VERSION
    if (!user.referral.code) {
      await user.generateReferralCode();
      // Save the user AFTER generating the code, outside the method
      await user.save();
    }
    
    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        
        // Complete Subscription Info
        subscription: {
          plan: user.subscription?.plan || 'free',
          status: user.subscription?.status || 'active',
          billing_cycle: user.subscription?.billing_cycle || null,
          started_at: user.subscription?.started_at || user.timestamps?.created_at,
          current_period_start: user.subscription?.current_period_start || null,
          current_period_end: user.subscription?.current_period_end || null,
          cancel_at_period_end: user.subscription?.cancel_at_period_end || false,
          cancelled_at: user.subscription?.cancelled_at || null
        },
        
        // Credits
        credits: {
          balance: user.credits?.balance || 100,
          monthly_allocation: user.credits?.monthly_allocation || 100,
          referral_credits: user.credits?.referral_credits || 0,
          next_reset_at: user.credits?.next_reset_at || new Date(),
          lifetime_earned: user.credits?.lifetime_earned || 100,
          lifetime_spent: user.credits?.lifetime_spent || 0
        },
        
        // Complete Usage Stats with Limits
        usage: {
          summaries_today: user.usage?.summaries_today || 0,
          summaries_this_week: user.usage?.summaries_this_week || 0,
          summaries_this_month: user.usage?.summaries_this_month || 0,
          total_summaries: user.usage?.total_summaries || 0,
          total_videos_watched: user.usage?.total_videos_watched || 0,
          total_time_saved: user.usage?.total_time_saved || 0,
          last_summary_at: user.usage?.last_summary_at || null,
          
          // Usage Limits (crucial for dashboard)
          limits: {
            daily_summaries: user.usage?.limits?.daily_summaries || 30,
            monthly_summaries: user.usage?.limits?.monthly_summaries || 150,
            video_duration_seconds: user.usage?.limits?.video_duration_seconds || 1200
          },
          
          daily_reset_at: user.usage?.daily_reset_at
        },
        
        // Preferences
        preferences: user.preferences,
        
        // Features
        features: user.features,
        
        // Referral info
        referral: {
          code: user.referral.code,
          total_referrals: user.referral?.total_referrals || 0,
          total_credits_earned: user.referral?.total_credits_earned || 0
        },
        
        // Timestamps
        timestamps: {
          created_at: user.timestamps?.created_at,
          last_activity: user.timestamps?.last_activity,
          last_login: user.timestamps?.last_login
        }
      }
    });
    
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      error: 'Failed to fetch profile',
      message: error.message
    });
  }
});

// Add this debug endpoint to see what's being returned
router.get('/debug/redirect-test', (req, res) => {
  res.json({
    FRONTEND_URL: process.env.FRONTEND_URL,
    callbackUrl: `${process.env.FRONTEND_URL}/auth/callback?success=true`,
    dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
    loginUrl: `${process.env.FRONTEND_URL}/login`
  });
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
// VIDEO SUMMARY ROUTES (WITH CACHING)
// ============================================

router.post('/summary/check-cache', authenticateJWT, async (req, res) => {
  try {
    const { video_id, ai_provider = 'openai', length = 'medium' } = req.body;
    
    const cached = await Video.getCachedSummary(video_id, ai_provider, length);
    
    if (cached) {
      res.json({
        success: true,
        cached: true,
        video: {
          id: cached.video.video_id,
          title: cached.video.title,
          duration: cached.video.duration
        },
        summary: cached.summary
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

router.post('/summary/generate', authenticateJWT, trackIP, async (req, res) => {
  try {
    const {
      video_id,
      video_title,
      video_url,
      video_duration,
      channel_name,
      channel_id,
      ai_provider = 'openai',
      model_used = 'gpt-4',
      summary_length = 'medium',
      thumbnail_url
    } = req.body;

    const user = req.user;

    // Check for cached summary
    const cachedResult = await Video.getCachedSummary(video_id, ai_provider, summary_length);
    
    if (cachedResult) {
      console.log('✅ Cache HIT! Returning cached summary');
      
      if (user.subscription.plan === 'free') {
        await user.deductCredits(1, 'Video summary (cached)', {
          video_id,
          video_title,
          cached: true
        });
      }
      
      await user.logUsage({
        video_id,
        video_title,
        video_url,
        video_duration,
        channel_name,
        ai_provider,
        model_used,
        summary_length,
        credits_used: user.subscription.plan === 'free' ? 1 : 0,
        processing_time: 0,
        success: true
      });
      
      return res.json({
        success: true,
        cached: true,
        summary: cachedResult.summary.text,
        key_points: cachedResult.summary.key_points,
        chapters: cachedResult.summary.chapters,
        video: {
          id: cachedResult.video.video_id,
          title: cachedResult.video.title,
          duration: cachedResult.video.duration
        },
        credits_remaining: user.credits.balance,
        usage: {
          summaries_this_month: user.usage.summaries_this_month,
          total_summaries: user.usage.total_summaries
        }
      });
    }

    console.log('❌ Cache MISS! Generating new summary');

    // Check if user can generate
    const canGenerate = user.canGenerateSummary(video_duration);
    if (!canGenerate.allowed) {
      return res.status(403).json({
        error: canGenerate.reason,
        credits_balance: user.credits.balance,
        next_reset: user.credits.next_reset_at
      });
    }

    // Deduct credits for free users
    if (user.subscription.plan === 'free') {
      await user.deductCredits(1, 'Video summary generated', {
        video_id,
        video_title,
        video_duration,
        ai_provider
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

    // Cache the summary
    let video = await Video.findOne({ video_id });
    
    if (!video) {
      video = await Video.create({
        video_id,
        video_url,
        title: video_title,
        channel_name,
        channel_id,
        duration: video_duration,
        thumbnail_url
      });
    }
    
    video.addSummary({
      ai_provider,
      model: model_used,
      length: summary_length,
      text: aiResponse.summary,
      key_points: aiResponse.key_points || [],
      chapters: aiResponse.chapters || [],
      tags: aiResponse.tags || [],
      word_count: aiResponse.summary.split(' ').length,
      processing_time: processingTime,
      tokens_used: aiResponse.tokens_used || 0,
      cost: aiResponse.cost || 0
    });
    
    await video.save();

    // Log usage
    await user.logUsage({
      video_id,
      video_title,
      video_url,
      video_duration,
      channel_name,
      ai_provider,
      model_used,
      summary_length,
      credits_used: user.subscription.plan === 'free' ? 1 : 0,
      processing_time: processingTime,
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
      video: {
        id: video_id,
        title: video_title,
        duration: video_duration
      },
      credits_remaining: user.credits.balance,
      usage: {
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
        video_title: req.body.video_title,
        success: false,
        error_message: error.message
      });
    }
    
    res.status(500).json({ error: 'Summary generation failed', message: error.message });
  }
});

// Mock AI function
async function generateSummaryWithAI(options) {
  return {
    summary: `This is a ${options.length} summary of: ${options.video_title}`,
    key_points: [
      'Key point 1 from the video',
      'Key point 2 from the video',
      'Key point 3 from the video'
    ],
    chapters: [
      { title: 'Introduction', timestamp: '0:00', summary: 'Video introduction' },
      { title: 'Main Content', timestamp: '2:30', summary: 'Main discussion points' },
      { title: 'Conclusion', timestamp: '8:45', summary: 'Final thoughts' }
    ],
    tags: ['education', 'tutorial', 'tech'],
    tokens_used: 500,
    cost: 0.01
  };
}

router.get('/summary/history', authenticateJWT, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const user = req.user;

    const history = user.usage_logs
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice((page - 1) * limit, page * limit);

    res.json({
      success: true,
      history,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: user.usage_logs.length
      }
    });
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// SUBSCRIPTION ROUTES
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

// ============================================
// ADMIN ROUTES
// ============================================

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
      message: `Reset for ${resetCount} users`
    });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ error: 'Reset failed' });
  }
});

router.get('/admin/cache-stats', async (req, res) => {
  try {
    const totalVideos = await Video.countDocuments();
    const totalSummaries = await Video.aggregate([
      { $project: { summaryCount: { $size: '$summaries' } } },
      { $group: { _id: null, total: { $sum: '$summaryCount' } } }
    ]);
    
    const mostPopular = await Video.getMostPopular(10);

    res.json({
      success: true,
      stats: {
        total_cached_videos: totalVideos,
        total_cached_summaries: totalSummaries[0]?.total || 0,
        most_popular_videos: mostPopular
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;