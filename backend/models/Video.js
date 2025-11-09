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

const Video = mongoose.model('Video', videoSchema);
module.exports = Video;