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

          daily_reset_at: user.usage?.daily_reset_at || new Date()
        },

        // Features (for Pro users)
        features: {
          unlimited_summaries: user.features?.unlimited_summaries || false,
          unlimited_video_length: user.features?.unlimited_video_length || false,
          premium_ai_models: user.features?.premium_ai_models || false,
          export_summaries: user.features?.export_summaries || false,
          priority_support: user.features?.priority_support || false
        },

        // Referral
        referral: {
          code: user.referral?.code || null,
          total_referrals: user.referral?.total_referrals || 0,
          total_credits_earned: user.referral?.total_credits_earned || 0
        },

        // Timestamps
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

router.post('/transcript/fetch', async (req, res) => {
  try {
    const {
      video_id,
      video_title,
      channel_name,
      duration
    } = req.body;

    const user = req.user;

    // 1. Check Supabase cache first
    let transcript = await supabaseService.getTranscript(video_id);

    if (transcript) {
      console.log('✅ TRANSCRIPT CACHE HIT (Supabase)');

      // Update access stats
      await supabaseService.updateTranscriptAccess(video_id);

      // Track in MongoDB (lightweight tracking only)
      let video = await Video.findOne({ video_id });
      if (!video) {
        video = await Video.create({
          video_id,
          video_url: `https://youtube.com/watch?v=${video_id}`,
          title: video_title,
          channel_name,
          duration
        });
      }
      video.trackUserAccess(user._id, user.email);
      await video.save();

      return res.json({
        success: true,
        cached: true,
        source: 'supabase',
        transcript: {
          full_text: transcript.full_text,
          segments: transcript.segments,
          language: transcript.language,
          word_count: transcript.word_count
        }
      });
    }

    console.log('❌ TRANSCRIPT CACHE MISS - Fetching from YouTube');

    // 2. Fetch from YouTube API
    const fetchedTranscript = await fetchTranscriptFromYouTube(video_id);

    if (!fetchedTranscript) {
      return res.status(404).json({ error: 'Transcript not available for this video' });
    }

    // 3. Store in Supabase
    // In your /transcript/fetch route, after fetching from YouTube:
    const storedTranscript = await supabaseService.storeTranscript({
      video_id,
      video_title: fetchedTranscript.video_title,  // From API response
      channel_name: fetchedTranscript.channel_name,  // From API response
      duration,
      full_text: fetchedTranscript.full_text,
      segments: fetchedTranscript.segments,
      language: fetchedTranscript.language,
      source: fetchedTranscript.source
    });

    // 4. Track in MongoDB (lightweight)
    let video = await Video.findOne({ video_id });
    if (!video) {
      video = await Video.create({
        video_id,
        video_url: `https://youtube.com/watch?v=${video_id}`,
        title: video_title,
        channel_name,
        duration
      });
    }
    video.trackUserAccess(user._id, user.email);
    await video.save();

    res.json({
      success: true,
      cached: false,
      source: 'youtube',
      transcript: {
        full_text: storedTranscript.full_text,
        segments: storedTranscript.segments,
        language: storedTranscript.language,
        word_count: storedTranscript.word_count
      }
    });

  } catch (error) {
    console.error('Transcript fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch transcript' });
  }
});

// ============================================
// SUMMARY ROUTES (WITH SUPABASE)
// ============================================

router.post('/summary/check-cache', authenticateJWT, async (req, res) => {
  try {
    const { video_id, ai_provider = 'openai', length = 'medium' } = req.body;

    // Check Supabase first
    const cachedSummary = await supabaseService.getSummary(video_id, ai_provider, length);

    if (cachedSummary) {
      // Update access stats
      await supabaseService.updateSummaryAccess(video_id, ai_provider, length);

      return res.json({
        success: true,
        cached: true,
        source: 'supabase',
        video: {
          id: cachedSummary.video_id,
          title: cachedSummary.video_title,
          duration: cachedSummary.duration
        },
        summary: {
          text: cachedSummary.text,
          key_points: cachedSummary.key_points,
          chapters: cachedSummary.chapters,
          tags: cachedSummary.tags,
          sentiment: cachedSummary.sentiment
        }
      });
    }

    res.json({
      success: true,
      cached: false,
      message: 'No cached summary found'
    });
  } catch (error) {
    console.error('Summary cache check error:', error);
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

    // 1. Check Supabase cache first
    let summary = await supabaseService.getSummary(video_id, ai_provider, summary_length);

    if (summary) {
      console.log('✅ SUMMARY CACHE HIT (Supabase)');

      // Update access stats
      await supabaseService.updateSummaryAccess(video_id, ai_provider, summary_length);

      // Deduct credits for free users
      if (user.subscription.plan === 'free') {
        await user.deductCredits(1, 'Video summary (cached)', {
          video_id,
          video_title,
          cached: true
        });
      }

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
        processing_time: 0,
        success: true
      });

      // Track in MongoDB (lightweight)
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
      video.trackUserAccess(user._id, user.email);
      await video.save();

      return res.json({
        success: true,
        cached: true,
        source: 'supabase',
        summary: summary.text,
        key_points: summary.key_points,
        chapters: summary.chapters,
        tags: summary.tags,
        video: {
          id: summary.video_id,
          title: summary.video_title,
          duration: summary.duration
        },
        credits_remaining: user.credits.balance,
        usage: {
          summaries_this_month: user.usage.summaries_this_month,
          total_summaries: user.usage.total_summaries
        }
      });
    }

    console.log('❌ SUMMARY CACHE MISS - Generating new summary');

    // 2. Check if user can generate
    const canGenerate = user.canGenerateSummary(video_duration);
    if (!canGenerate.allowed) {
      return res.status(403).json({
        error: canGenerate.reason,
        credits_balance: user.credits.balance,
        next_reset: user.credits.next_reset_at
      });
    }

    // 3. Deduct credits for free users
    if (user.subscription.plan === 'free') {
      await user.deductCredits(1, 'Video summary generated', {
        video_id,
        video_title,
        video_duration,
        ai_provider
      });
    }

    // 4. Generate with AI
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

    // 5. Store in Supabase
    const storedSummary = await supabaseService.storeSummary({
      video_id,
      video_title,
      channel_name,
      duration: video_duration,
      ai_provider,
      model: model_used,
      length: summary_length,
      text: aiResponse.summary,
      key_points: aiResponse.key_points || [],
      chapters: aiResponse.chapters || [],
      tags: aiResponse.tags || [],
      sentiment: aiResponse.sentiment,
      processing_time: processingTime,
      tokens_used: aiResponse.tokens_used || 0,
      cost_usd: aiResponse.cost || 0,
      generated_by_user_id: user._id.toString(),
      generated_by_user_email: user.email
    });

    // 6. Track in MongoDB (lightweight)
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
    video.trackUserAccess(user._id, user.email);
    video.stats.total_summaries_generated += 1;
    await video.save();

    // 7. Log usage
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
      source: 'ai_generated',
      summary: storedSummary.text,
      key_points: storedSummary.key_points,
      chapters: storedSummary.chapters,
      tags: storedSummary.tags,
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

// Mock AI function (replace with your actual AI integration)
async function generateSummaryWithAI(options) {
  // TODO: Integrate with OpenAI, Anthropic, or Google AI
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
    sentiment: 'positive',
    tokens_used: 500,
    cost: 0.01
  };
}

// Mock YouTube transcript fetch (replace with actual implementation)
async function fetchTranscriptFromYouTube(videoId) {
  try {
    const response = await fetch(
      "https://web-production-ab45.up.railway.app/api/transcript/byapi",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"  // ADD THIS!
        },
        body: JSON.stringify({ video_id: videoId })
      }
    );

    const data = await response.json();

    if (!data.success) {
      throw new Error("Transcript not available");
    }

    // Transform API response to match your schema
    return {
      full_text: data.plain_text || "",
      segments: (data.transcript_segments || []).map(seg => ({
        text: seg.text || "",
        start: parseFloat(seg.start || 0),
        duration: parseFloat(seg.dur || 0)
      })),
      language: data.language || "unknown",
      source: data.source || "youtube-transcript.io",
      video_title: data.title,
      channel_name: data.author,
      word_count: data.word_count
    };
  } catch (err) {
    console.error("Error fetching transcript:", err);
    return null;  // Return null on error
  }
}


// ============================================
// ADMIN ROUTES (WITH SUPABASE STATS)
// ============================================

router.get('/admin/cache-stats', authenticateJWT, async (req, res) => {
  try {
    // Get stats from both Supabase and MongoDB
    const supabaseStats = await supabaseService.getCacheStats();

    const mongoStats = {
      total_videos: await Video.countDocuments(),
      most_popular: await Video.getMostPopular(10)
    };

    res.json({
      success: true,
      stats: {
        supabase: supabaseStats,
        mongodb: mongoStats,
        note: 'Heavy data (transcripts/summaries) stored in Supabase, metadata in MongoDB'
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/admin/trending', authenticateJWT, async (req, res) => {
  try {
    const trending = await supabaseService.getTrendingVideos(20);

    res.json({
      success: true,
      trending
    });
  } catch (error) {
    console.error('Trending error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;