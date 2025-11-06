const User = require('../models/User');
const Video = require('../models/Video');

// Check and auto-reset credits if needed (only for free users)
async function checkAndResetMonthlyCredits(userId) {
  const user = await User.findById(userId);
  
  if (user.subscription.plan === 'free') {
    const now = new Date();
    if (now >= user.credits.next_reset_at) {
      await user.resetMonthlyCredits();
      console.log(`✅ Auto-reset credits for: ${user.email}`);
    }
  }
  
  return user;
}

// Validate if user can generate summary
async function validateSummaryRequest(userId, videoDuration) {
  const user = await checkAndResetMonthlyCredits(userId);
  
  const validation = user.canGenerateSummary(videoDuration);
  
  if (!validation.allowed) {
    return {
      allowed: false,
      reason: validation.reason,
      user_plan: user.subscription.plan,
      is_premium: user.is_premium,
      credits_remaining: user.credits.balance,
      next_reset: user.credits.next_reset_at,
      ...validation
    };
  }
  
  return {
    allowed: true,
    reason: validation.reason,
    user_plan: user.subscription.plan,
    is_premium: user.is_premium,
    credits_remaining: user.credits.balance,
    daily_remaining: validation.daily_remaining
  };
}


async function calculateReferralCredits(referralCount) {
  if (referralCount === 0) {
    return 50; // First referral: 50 credits
  } else if (referralCount === 1) {
    return 25; // Second referral: 25 credits
  } else {
    return 15; // Third onwards: 15 credits each
  }
}

// Get or fetch transcript (with caching)
async function getOrFetchTranscript(videoId) {
  // STEP 1: Check cache
  const cached = await Video.getCachedTranscript(videoId);
  
  if (cached) {
    console.log('✅ TRANSCRIPT CACHE HIT:', videoId);
    return {
      success: true,
      cached: true,
      transcript: cached.transcript,
      video: cached.video
    };
  }
  
  console.log('❌ TRANSCRIPT CACHE MISS - Fetching from YouTube:', videoId);
  
  // STEP 2: Fetch from YouTube
  try {
    const transcript = await fetchYouTubeTranscript(videoId);
    
    // STEP 3: Cache it for future users
    const video = await Video.findOne({ video_id: videoId });
    if (video) {
      video.addTranscript(transcript);
      await video.save();
    }
    
    return {
      success: true,
      cached: false,
      transcript: transcript,
      video: video
    };
    
  } catch (error) {
    console.error('Transcript fetch error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Smart cache lookup and generation
async function getOrGenerateSummary(videoData, aiConfig, userId) {
  const { 
    video_id, 
    video_duration, 
    video_title, 
    video_url, 
    channel_name, 
    channel_id, 
    thumbnail_url,
    published_at
  } = videoData;
  
  const { ai_provider, model, length } = aiConfig;
  
  const user = await User.findById(userId);
  const isFree = user.subscription.plan === 'free';
  
  // STEP 1: Get or create video record
  let video = await Video.getOrCreate({
    video_id,
    video_url,
    title: video_title,
    channel_name,
    channel_id,
    duration: video_duration,
    thumbnail_url,
    published_at
  });
  
  // Track user access
  video.trackUserAccess(userId, user.email);
  
  // STEP 2: Check if summary exists in cache
  const cachedSummary = video.getSummary(ai_provider, length);
  
  if (cachedSummary) {
    console.log(`✅ SUMMARY CACHE HIT: ${video_id} - User: ${user.email}`);
    
    // Deduct credits ONLY for free users
    if (isFree) {
      await user.deductCredits(1, 'Video summary (cached)', { 
        video_id, 
        cached: true,
        ai_provider,
        length
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
      model_used: model,
      summary_length: length,
      credits_used: isFree ? 1 : 0,
      processing_time: 0,
      success: true
    });
    
    await video.save(); // Save updated stats
    
    return {
      success: true,
      cached: true,
      generated_by: cachedSummary.generated_by,
      summary: cachedSummary,
      video: {
        video_id: video.video_id,
        title: video.title,
        channel_name: video.channel_name,
        duration: video.duration,
        thumbnail_url: video.thumbnail_url,
        cache_stats: {
          total_views: video.stats.total_views,
          cache_hits: video.stats.cache_hits,
          cache_efficiency: video.cache_efficiency
        }
      },
      credits_remaining: user.credits.balance,
      is_premium: user.is_premium
    };
  }
  
  console.log(`❌ SUMMARY CACHE MISS - Generating new: ${video_id} - User: ${user.email}`);
  
  // STEP 3: Generate new summary
  
  // Deduct credits ONLY for free users (before API call)
  if (isFree) {
    try {
      await user.deductCredits(1, 'Video summary generated', { 
        video_id,
        ai_provider,
        length
      });
    } catch (error) {
      return {
        success: false,
        error: 'Insufficient credits',
        credits_remaining: user.credits.balance
      };
    }
  }
  
  const startTime = Date.now();
  
  try {
    // STEP 4: Get transcript (cached or fetch)
    const transcriptResult = await getOrFetchTranscript(video_id);
    
    if (!transcriptResult.success) {
      throw new Error('Failed to fetch transcript');
    }
    
    // STEP 5: Call AI provider with transcript
    const aiSummary = await callAIProvider(ai_provider, model, {
      video_id,
      video_title,
      video_duration,
      length,
      transcript: transcriptResult.transcript.full_text
    });
    
    const processingTime = Date.now() - startTime;
    
    // STEP 6: Cache the summary for ALL future users
    const newSummary = video.addSummary({
      ai_provider,
      model,
      length,
      text: aiSummary.summary,
      key_points: aiSummary.key_points || [],
      chapters: aiSummary.chapters || [],
      tags: aiSummary.tags || [],
      sentiment: aiSummary.sentiment,
      word_count: aiSummary.summary.split(/\s+/).length,
      processing_time: processingTime,
      tokens_used: aiSummary.tokens_used || 0,
      cost_usd: aiSummary.cost_usd || 0
    }, userId, user.email);
    
    await video.save();
    
    // STEP 7: Log usage
    await user.logUsage({
      video_id,
      video_title,
      video_url,
      video_duration,
      channel_name,
      ai_provider,
      model_used: model,
      summary_length: length,
      credits_used: isFree ? 1 : 0,
      processing_time: processingTime,
      success: true
    });
    
    console.log(`✅ Summary generated and cached: ${video_id} by ${user.email}`);
    
    return {
      success: true,
      cached: false,
      generated_by: {
        user_id: userId,
        user_email: user.email
      },
      summary: newSummary,
      video: {
        video_id: video.video_id,
        title: video.title,
        channel_name: video.channel_name,
        duration: video.duration,
        thumbnail_url: video.thumbnail_url,
        cache_stats: {
          total_views: video.stats.total_views,
          cache_hits: video.stats.cache_hits,
          cache_efficiency: video.cache_efficiency
        }
      },
      processing_time: processingTime,
      credits_remaining: user.credits.balance,
      is_premium: user.is_premium,
      message: 'Summary generated and cached for future users'
    };
    
  } catch (error) {
    console.error('AI generation error:', error);
    
    // Refund credits for free users on failure
    if (isFree) {
      await user.addCredits(1, 'refund', 'Summary generation failed', {
        video_id,
        error: error.message
      });
    }
    
    // Log failed attempt
    await user.logUsage({
      video_id,
      video_title,
      video_url,
      video_duration,
      channel_name,
      ai_provider,
      model_used: model,
      summary_length: length,
      credits_used: 0,
      processing_time: Date.now() - startTime,
      success: false,
      error_message: error.message
    });
    
    return {
      success: false,
      error: error.message,
      credits_remaining: user.credits.balance
    };
  }
}

// Mock YouTube transcript fetcher (replace with real implementation)
async function fetchYouTubeTranscript(videoId) {
  // TODO: Replace with real YouTube Transcript API
  // Libraries: youtube-transcript, @distube/ytdl-core
  
  console.log(`🔍 Fetching transcript for: ${videoId}`);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock transcript data
  return {
    full_text: "This is a sample transcript of the video. It contains all the spoken words from the video content. In a real implementation, this would be fetched from YouTube's transcript API.",
    segments: [
      { text: "This is a sample transcript of the video.", start_time: 0, end_time: 3.5 },
      { text: "It contains all the spoken words from the video content.", start_time: 3.5, end_time: 7.2 },
      { text: "In a real implementation, this would be fetched from YouTube's transcript API.", start_time: 7.2, end_time: 12.0 }
    ],
    language: 'en',
    source: 'youtube_auto'
  };
}

// Mock AI call (replace with real implementation)
async function callAIProvider(provider, model, data) {
  console.log(`🤖 Calling ${provider} AI with model: ${model}`);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // TODO: Replace with actual API calls
  // OpenAI: const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  // Anthropic: const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  // Google: const genai = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  
  const summaryLengths = {
    short: '2-3 sentences',
    medium: '5-7 sentences',
    long: '10-15 sentences'
  };
  
  return {
    summary: `This is a ${data.length} summary of "${data.video_title}" (${summaryLengths[data.length]}). The video provides comprehensive coverage of the topic with detailed explanations and practical examples. Key concepts are explained clearly with step-by-step demonstrations.`,
    key_points: [
      'Main concept explained with clear examples',
      'Practical demonstrations and real-world applications',
      'Step-by-step walkthrough of the process',
      'Best practices and common pitfalls to avoid',
      'Additional resources and recommendations'
    ],
    chapters: [
      { title: 'Introduction', timestamp: '0:00', summary: 'Overview of the main topic' },
      { title: 'Core Concepts', timestamp: '2:30', summary: 'Detailed explanation of key ideas' },
      { title: 'Practical Examples', timestamp: '5:15', summary: 'Real-world demonstrations' },
      { title: 'Best Practices', timestamp: '8:00', summary: 'Tips and recommendations' },
      { title: 'Conclusion', timestamp: '10:45', summary: 'Summary and next steps' }
    ],
    tags: ['education', 'tutorial', 'guide', 'how-to'],
    sentiment: 'positive',
    tokens_used: 1250,
    cost_usd: 0.00125 // Example cost
  };
}

// Process referral
async function processReferral(newUserId, referralCode) {
  if (!referralCode) return null;
  
  const newUser = await User.findById(newUserId);
  const referrer = await User.findOne({ 'referral.code': referralCode });
  
  if (!referrer || !newUser) {
    return { success: false, message: 'Invalid referral code' };
  }
  
  if (referrer._id.toString() === newUserId.toString()) {
    return { success: false, message: 'Cannot refer yourself' };
  }
  
  const alreadyReferred = referrer.referral.referred_users.find(
    u => u.user_id.toString() === newUserId.toString()
  );
  
  if (alreadyReferred) {
    return { success: false, message: 'Referral already applied' };
  }
  
  referrer.referral.referred_users.push({
    user_id: newUser._id,
    email: newUser.email,
    signed_up_at: new Date(),
    credits_given: 10
  });
  
  referrer.referral.total_referrals += 1;
  referrer.referral.total_credits_earned += 10;
  
  await referrer.addCredits(10, 'earned', `Referral bonus: ${newUser.email}`, {
    referred_user_id: newUser._id,
    referred_user_email: newUser.email
  });
  
  await referrer.save();
  
  await newUser.addCredits(5, 'bonus', 'Welcome referral bonus', {
    referrer_id: referrer._id,
    referrer_email: referrer.email
  });
  
  console.log(`✅ Referral processed: ${referrer.email} → ${newUser.email}`);
  
  return {
    success: true,
    referrer_earned: 10,
    new_user_bonus: 5,
    referrer_email: referrer.email
  };
}

// Get user dashboard
async function getUserDashboard(userId) {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  const isPremium = user.is_premium;
  
  return {
    user: {
      name: user.name,
      email: user.email,
      picture: user.picture
    },
    subscription: {
      plan: user.subscription.plan,
      status: user.subscription.status,
      is_premium: isPremium,
      billing_cycle: user.subscription.billing_cycle,
      current_period_end: user.subscription.current_period_end
    },
    credits: isPremium ? {
      status: 'unlimited',
      message: 'Premium users have unlimited summaries'
    } : {
      balance: user.credits.balance,
      monthly_allocation: user.credits.monthly_allocation,
      next_reset: user.credits.next_reset_at,
      lifetime_earned: user.credits.lifetime_earned,
      lifetime_spent: user.credits.lifetime_spent,
      percentage: user.credit_percentage
    },
    usage: {
      summaries_today: user.usage.summaries_today,
      summaries_this_month: user.usage.summaries_this_month,
      total_summaries: user.usage.total_summaries,
      time_saved_minutes: user.usage.total_time_saved,
      limits: isPremium ? {
        daily_summaries: 'unlimited',
        video_duration: 'unlimited'
      } : {
        daily_summaries: user.usage.limits.daily_summaries,
        daily_remaining: user.usage.limits.daily_summaries - user.usage.summaries_today,
        video_duration_minutes: user.usage.limits.video_duration_seconds / 60
      }
    },
    referral: {
      code: user.referral.code || await user.generateReferralCode(),
      total_referrals: user.referral.total_referrals,
      credits_earned: user.referral.total_credits_earned
    },
    features: user.features.toObject()
  };
}

// Get cache statistics (for admin/analytics)
async function getCacheStatistics() {
  const videoStats = await Video.getCacheStats();
  const userStats = await User.aggregate([
    {
      $group: {
        _id: null,
        total_users: { $sum: 1 },
        free_users: {
          $sum: { $cond: [{ $eq: ['$subscription.plan', 'free'] }, 1, 0] }
        },
        premium_users: {
          $sum: { $cond: [{ $eq: ['$subscription.plan', 'pro'] }, 1, 0] }
        },
        total_summaries: { $sum: '$usage.total_summaries' }
      }
    }
  ]);
  
  return {
    videos: videoStats,
    users: userStats[0] || {},
    cache_efficiency: videoStats ? `${videoStats.overall_cache_hit_rate}%` : 'N/A',
    api_calls_saved: videoStats ? videoStats.total_cache_hits : 0
  };
}

// Get popular videos
async function getPopularVideos(limit = 10) {
  return await Video.getMostPopular(limit);
}

// Get trending videos
async function getTrendingVideos(limit = 10) {
  return await Video.getTrending(limit);
}



module.exports = {
  checkAndResetMonthlyCredits,
  validateSummaryRequest,
  getOrGenerateSummary,
  getOrFetchTranscript,
  processReferral,
  getUserDashboard,
  getCacheStatistics,
  getPopularVideos,
  getTrendingVideos,
  calculateReferralCredits
};