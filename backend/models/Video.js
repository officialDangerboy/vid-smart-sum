const mongoose = require('mongoose');
const crypto = require('crypto');

const videoSchema = new mongoose.Schema({
  // YouTube Video Info
  video_id: {
    type: String,
    required: true,
    unique: true,
    index: true
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
      enum: ['openai', 'anthropic', 'google'],
      required: true,
      index: true
    },
    model: String,
    length: {
      type: String,
      enum: ['short', 'medium', 'long'],
      default: 'medium',
      index: true
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
    chapters: [{
      title: String,
      timestamp: String,
      summary: String
    }],
    tags: [String],
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative', 'mixed']
    },
    word_count: Number,
    generated_at: {
      type: Date,
      default: Date.now,
      index: true
    },
    processing_time: Number,
    tokens_used: Number,
    cost_usd: Number, // Track API cost
    
    // Track who generated this (first user)
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
      default: Date.now,
      index: true
    },
    first_accessed: {
      type: Date,
      default: Date.now
    },
    
    // Per provider stats
    by_provider: {
      openai: { type: Number, default: 0 },
      anthropic: { type: Number, default: 0 },
      google: { type: Number, default: 0 }
    },
    
    // Per length stats
    by_length: {
      short: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      long: { type: Number, default: 0 }
    }
  },
  
  // User tracking (who accessed this video)
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
  
  // Timestamps
  created_at: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  
  // Cache expiration (6 months)
  cache_expires_at: {
    type: Date,
    default: () => {
      const sixMonths = new Date();
      sixMonths.setMonth(sixMonths.getMonth() + 6);
      return sixMonths;
    },
    index: true
  },
  
  // Flags
  is_popular: {
    type: Boolean,
    default: false,
    index: true
  },
  is_flagged: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// ============================================
// INDEXES
// ============================================
videoSchema.index({ video_id: 1 });
videoSchema.index({ 'stats.last_accessed': -1 });
videoSchema.index({ cache_expires_at: 1 });
videoSchema.index({ 'summaries.ai_provider': 1, 'summaries.length': 1 });
videoSchema.index({ 'stats.cache_hits': -1 });
videoSchema.index({ is_popular: 1, 'stats.total_views': -1 });

// Compound indexes for efficient queries
videoSchema.index({ video_id: 1, 'summaries.ai_provider': 1, 'summaries.length': 1 });

// ============================================
// VIRTUAL FIELDS
// ============================================

videoSchema.virtual('cache_efficiency').get(function() {
  if (this.stats.total_views === 0) return 0;
  return ((this.stats.cache_hits / this.stats.total_views) * 100).toFixed(2);
});

videoSchema.virtual('is_trending').get(function() {
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.stats.last_accessed > last24Hours && this.stats.total_views > 10;
});

// ============================================
// INSTANCE METHODS
// ============================================

// Get existing summary (with cache hit tracking)
videoSchema.methods.getSummary = function(provider, length = 'medium') {
  const existingSummary = this.summaries.find(s => 
    s.ai_provider === provider && s.length === length
  );
  
  if (existingSummary) {
    // Update cache stats
    this.stats.cache_hits += 1;
    this.stats.last_accessed = new Date();
    
    // Update cache hit rate
    if (this.stats.total_views > 0) {
      this.stats.cache_hit_rate = (this.stats.cache_hits / this.stats.total_views) * 100;
    }
    
    // Update provider stats
    this.stats.by_provider[provider] = (this.stats.by_provider[provider] || 0) + 1;
    this.stats.by_length[length] = (this.stats.by_length[length] || 0) + 1;
    
    return existingSummary;
  }
  
  return null;
};

// Get transcript (cached)
videoSchema.methods.getTranscript = function() {
  if (this.transcript && this.transcript.full_text) {
    return this.transcript;
  }
  return null;
};

// Add transcript (first time only)
videoSchema.methods.addTranscript = function(transcriptData) {
  if (!this.transcript || !this.transcript.full_text) {
    this.transcript = {
      full_text: transcriptData.full_text,
      segments: transcriptData.segments || [],
      language: transcriptData.language || 'en',
      word_count: transcriptData.full_text.split(/\s+/).length,
      generated_at: new Date(),
      source: transcriptData.source || 'youtube_auto'
    };
    console.log(`✅ Transcript cached for: ${this.video_id}`);
  }
};

// Add new summary (with user tracking)
videoSchema.methods.addSummary = function(summaryData, userId = null, userEmail = null) {
  // Check if this exact summary already exists
  const exists = this.summaries.find(s => 
    s.ai_provider === summaryData.ai_provider && 
    s.length === summaryData.length
  );
  
  if (exists) {
    console.log(`⚠️ Summary already exists: ${this.video_id} - ${summaryData.ai_provider} - ${summaryData.length}`);
    return exists;
  }
  
  // Add generated_by info
  if (userId) {
    summaryData.generated_by = {
      user_id: userId,
      user_email: userEmail
    };
  }
  
  this.summaries.push(summaryData);
  this.stats.total_summaries_generated += 1;
  this.stats.last_accessed = new Date();
  
  console.log(`✅ New summary cached: ${this.video_id} - ${summaryData.ai_provider} - ${summaryData.length}`);
  
  return this.summaries[this.summaries.length - 1];
};

// Track user access
videoSchema.methods.trackUserAccess = function(userId, userEmail) {
  const existingUser = this.accessed_by.find(u => 
    u.user_id.toString() === userId.toString()
  );
  
  if (existingUser) {
    existingUser.access_count += 1;
    existingUser.last_access = new Date();
  } else {
    this.accessed_by.push({
      user_id: userId,
      user_email: userEmail,
      access_count: 1,
      first_access: new Date(),
      last_access: new Date()
    });
    this.stats.unique_users += 1;
  }
  
  this.stats.total_views += 1;
  this.stats.last_accessed = new Date();
  
  // Mark as popular if > 50 views
  if (this.stats.total_views > 50) {
    this.is_popular = true;
  }
};

// Check cache validity
videoSchema.methods.isCacheValid = function() {
  return new Date() < this.cache_expires_at;
};

// Extend cache expiration (when accessed)
videoSchema.methods.extendCache = function() {
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
  this.cache_expires_at = sixMonthsFromNow;
};

// ============================================
// STATIC METHODS
// ============================================

// Get or create video record
videoSchema.statics.getOrCreate = async function(videoData) {
  let video = await this.findOne({ video_id: videoData.video_id });
  
  if (!video) {
    video = await this.create({
      video_id: videoData.video_id,
      video_url: videoData.video_url,
      title: videoData.title,
      channel_name: videoData.channel_name,
      channel_id: videoData.channel_id,
      duration: videoData.duration,
      thumbnail_url: videoData.thumbnail_url,
      published_at: videoData.published_at
    });
    console.log(`✅ New video record created: ${videoData.video_id}`);
  }
  
  return video;
};

// Get cached transcript
videoSchema.statics.getCachedTranscript = async function(videoId) {
  const video = await this.findOne({ video_id: videoId });
  
  if (!video || !video.isCacheValid()) {
    return null;
  }
  
  const transcript = video.getTranscript();
  
  if (transcript) {
    console.log(`✅ TRANSCRIPT CACHE HIT: ${videoId}`);
    return { video, transcript, cached: true };
  }
  
  console.log(`❌ TRANSCRIPT CACHE MISS: ${videoId}`);
  return null;
};

// Get cached summary (main method used by users)
videoSchema.statics.getCachedSummary = async function(videoId, provider, length) {
  const video = await this.findOne({ video_id: videoId });
  
  if (!video || !video.isCacheValid()) {
    return null;
  }
  
  const summary = video.getSummary(provider, length);
  
  if (summary) {
    console.log(`✅ SUMMARY CACHE HIT: ${videoId} - ${provider} - ${length}`);
    await video.save(); // Save updated stats
    return { video, summary, cached: true };
  }
  
  console.log(`❌ SUMMARY CACHE MISS: ${videoId} - ${provider} - ${length}`);
  return null;
};

// Clean expired cache
videoSchema.statics.cleanupExpiredCache = async function() {
  const result = await this.deleteMany({
    cache_expires_at: { $lt: new Date() }
  });
  
  console.log(`🗑️ Deleted ${result.deletedCount} expired video caches`);
  return result.deletedCount;
};

// Get most popular videos
videoSchema.statics.getMostPopular = async function(limit = 10) {
  return this.find({ is_popular: true })
    .sort({ 'stats.total_views': -1 })
    .limit(limit)
    .select('video_id title channel_name stats thumbnail_url');
};

// Get cache statistics
videoSchema.statics.getCacheStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total_videos: { $sum: 1 },
        total_summaries: { $sum: { $size: '$summaries' } },
        total_views: { $sum: '$stats.total_views' },
        total_cache_hits: { $sum: '$stats.cache_hits' },
        avg_summaries_per_video: { $avg: { $size: '$summaries' } },
        popular_videos: {
          $sum: { $cond: ['$is_popular', 1, 0] }
        }
      }
    }
  ]);
  
  if (stats.length === 0) return null;
  
  const data = stats[0];
  data.overall_cache_hit_rate = data.total_views > 0 
    ? ((data.total_cache_hits / data.total_views) * 100).toFixed(2)
    : 0;
  
  return data;
};

// Get trending videos (accessed in last 24h)
videoSchema.statics.getTrending = async function(limit = 10) {
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  return this.find({
    'stats.last_accessed': { $gte: last24Hours }
  })
    .sort({ 'stats.total_views': -1 })
    .limit(limit)
    .select('video_id title channel_name stats thumbnail_url');
};

// Get videos by provider usage
videoSchema.statics.getByProvider = async function(provider, limit = 10) {
  return this.find({
    'summaries.ai_provider': provider
  })
    .sort({ [`stats.by_provider.${provider}`]: -1 })
    .limit(limit)
    .select('video_id title channel_name stats thumbnail_url');
};

// ============================================
// MIDDLEWARE
// ============================================

videoSchema.pre('save', function(next) {
  this.updated_at = new Date();
  
  // Auto-extend cache for popular videos
  if (this.is_popular && this.stats.cache_hits > 100) {
    this.extendCache();
  }
  
  next();
});

// ============================================
// MODEL EXPORT
// ============================================

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;