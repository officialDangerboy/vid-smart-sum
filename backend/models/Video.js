const mongoose = require('mongoose');
const crypto = require('crypto');

const videoSchema = new mongoose.Schema({
  // YouTube Video Info
  video_id: {
    type: String,
    required: true,
    unique: true  // ✅ Only this should be unique
  },
  video_url: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  channel_name: String,
  channel_id: String,
  duration: Number,
  thumbnail_url: String,
  published_at: Date,
  
  // Transcript (Cached - shared across all users)
  transcript: {
    full_text: String,
    segments: [{
      text: String,
      start_time: Number,
      end_time: Number
    }],
    language: {
      type: String,
      default: 'en'
    },
    word_count: Number,
    generated_at: {
      type: Date,
      default: Date.now
    },
    source: {
      type: String,
      enum: ['youtube_auto', 'youtube_manual', 'youtube_generated'],
      default: 'youtube_auto'
    }
  },
  
  // AI Summaries (Cached - shared across all users)
  summaries: [{
    summary_id: {
      type: String,
      default: () => crypto.randomBytes(8).toString('hex')
    },
    ai_provider: {
      type: String,
      enum: ['openai', 'anthropic', 'google', 'python_backend'],  // ✅ Added python_backend
      required: true
      // ❌ REMOVED: unique: true - This was causing the error!
    },
    model: String,
    length: {
      type: String,
      enum: ['short', 'medium', 'detailed'],  // ✅ Changed 'long' to 'detailed'
      default: 'medium'
      // ❌ REMOVED: unique: true
    },
    language: {
      type: String,
      default: 'en'
    },
    text: {
      type: String,
      required: true
    },
    key_points: [String],
    key_takeaways: [String],  // ✅ Added
    main_topics: [String],     // ✅ Changed to array of strings
    chapters: [{
      title: String,
      timestamp: String,
      summary: String
    }],
    timestamps: [{  // ✅ Added for detailed summaries
      time: String,
      description: String
    }],
    tags: [String],
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative', 'mixed']
    },
    word_count: Number,
    generated_at: {
      type: Date,
      default: Date.now
      // ❌ REMOVED: unique: true
    },
    processing_time: Number,
    tokens_used: Number,
    cost_usd: Number,
    
    generated_by: {
      user_id: mongoose.Schema.Types.ObjectId,
      user_email: String
    }
  }],
  
  // Stats (Global across all users)
  stats: {
    total_views: {
      type: Number,
      default: 0
    },
    unique_users: {
      type: Number,
      default: 0
    },
    total_summaries_generated: {
      type: Number,
      default: 0
    },
    cache_hits: {
      type: Number,
      default: 0
    },
    cache_hit_rate: {
      type: Number,
      default: 0
    },
    last_accessed: {
      type: Date,
      default: Date.now
      // ❌ REMOVED: unique: true
    },
    first_accessed: {
      type: Date,
      default: Date.now
    },
    
    by_provider: {
      openai: { type: Number, default: 0 },
      anthropic: { type: Number, default: 0 },
      google: { type: Number, default: 0 },
      python_backend: { type: Number, default: 0 }  // ✅ Added
    },
    
    by_length: {
      short: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      detailed: { type: Number, default: 0 }  // ✅ Changed from 'long'
    }
  },
  
  accessed_by: [{
    user_id: mongoose.Schema.Types.ObjectId,
    user_email: String,
    access_count: {
      type: Number,
      default: 1
    },
    first_access: {
      type: Date,
      default: Date.now
    },
    last_access: {
      type: Date,
      default: Date.now
    }
  }],
  
  created_at: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  
  cache_expires_at: {
    type: Date,
    default: () => {
      const sixMonths = new Date();
      sixMonths.setMonth(sixMonths.getMonth() + 6);
      return sixMonths;
    }
    // ❌ REMOVED: unique: true
  },
  
  is_popular: {
    type: Boolean,
    default: false
    // ❌ REMOVED: unique: true
  },
  is_flagged: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// ✅ INDEXES - Proper compound index for summaries
videoSchema.index({ video_id: 1 });
videoSchema.index({ channel_id: 1 });
videoSchema.index({ 'stats.total_views': -1 });
videoSchema.index({ 'stats.last_accessed': -1 });
videoSchema.index({ 'summaries.ai_provider': 1, 'summaries.length': 1 });  // ✅ Compound index

// All your existing methods remain the same...
// (keep all the virtual fields, instance methods, static methods, and middleware)
// Around line 450-490 in routes/api.js

router.post('/summary/generate', authenticateJWT, trackIP, async (req, res) => {
  try {
    const {
      video_id,
      video_title,
      video_url,
      video_duration,
      channel_name,
      channel_id,
      ai_provider = 'python_backend',
      model_used = 'python_backend',
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
        success: true,
        cached: true
      });

      // ✅ FIX: Use findOne or create, then save properly
      let video = await Video.findOne({ video_id });
      if (!video) {
        video = new Video({
          video_id,
          video_url,
          title: video_title,
          channel_name,
          channel_id,
          duration: video_duration,
          thumbnail_url
        });
      }
      
      // Now trackUserAccess will work because video is a Mongoose document
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
      summary_type: summary_length,  // ✅ Changed from 'length' to 'summary_type'
      text: aiResponse.summary,
      key_points: aiResponse.key_points || [],
      key_takeaways: aiResponse.key_takeaways || [],
      main_topics: aiResponse.main_topics || [],
      chapters: aiResponse.chapters || [],
      timestamps: aiResponse.timestamps || [],
      tags: aiResponse.tags || [],
      sentiment: aiResponse.sentiment,
      processing_time: processingTime,
      tokens_used: aiResponse.tokens_used || 0,
      cost_usd: aiResponse.cost || 0,
      generated_by_user_id: user._id.toString(),
      generated_by_user_email: user.email
    });

    // 6. Track in MongoDB (lightweight) - ✅ FIXED
    let video = await Video.findOne({ video_id });
    if (!video) {
      // Create new video document
      video = new Video({
        video_id,
        video_url,
        title: video_title,
        channel_name,
        channel_id,
        duration: video_duration,
        thumbnail_url
      });
    }
    
    // Now methods will work
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
      success: true,
      cached: false
    });

    user.timestamps.last_activity = new Date();
    await user.save();

    res.json({
      success: true,
      cached: false,
      source: 'ai_generated',
      summary: storedSummary.text,
      key_points: storedSummary.key_points,
      key_takeaways: storedSummary.key_takeaways,
      main_topics: storedSummary.main_topics,
      chapters: storedSummary.chapters,
      timestamps: storedSummary.timestamps,
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

    res.status(500).json({ 
      success: false,
      error: 'Summary generation failed', 
      message: error.message 
    });
  }
});

const Video = mongoose.model('Video', videoSchema);
module.exports = Video;