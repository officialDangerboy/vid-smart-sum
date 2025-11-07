const { supabase } = require('../config/supabase');

// ============================================
// VIDEO TRANSCRIPT OPERATIONS
// ============================================

/**
 * Check if transcript exists in Supabase
 */
async function getTranscript(videoId) {
  try {
    console.log(`🔍 Checking Supabase for transcript: ${videoId}`);
    
    const { data, error } = await supabase
      .from('video_transcripts')
      .select('*')
      .eq('video_id', videoId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        console.log(`❌ Transcript not found in Supabase: ${videoId}`);
        return null;
      }
      throw error;
    }
    
    console.log(`✅ Transcript found in Supabase: ${videoId}`);
    return data;
  } catch (error) {
    console.error('Supabase getTranscript error:', error);
    return null;
  }
}

/**
 * Store transcript in Supabase
 */
async function storeTranscript(transcriptData) {
  try {
    const {
      video_id,
      video_title,
      channel_name,
      duration,
      full_text,
      segments = [],
      language = 'en',
      source = 'youtube_auto'
    } = transcriptData;

    const word_count = full_text ? full_text.trim().split(/\s+/).length : 0;

    console.log(`💾 Storing transcript in Supabase: ${video_id}`);

    const { data, error } = await supabase
      .from('video_transcripts')
      .upsert({
        video_id,
        video_title,
        channel_name,
        duration,
        full_text,
        segments,
        language,
        word_count,
        source,
        generated_at: new Date().toISOString(),
        last_accessed: new Date().toISOString(),
        access_count: 1  // ✅ Fixed
      }, { onConflict: 'video_id' })
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Transcript stored in Supabase: ${video_id}`);
    return data;
  } catch (error) {
    console.error('Supabase storeTranscript error:', error);
    throw error;
  }
}


/**
 * Update transcript access stats
 */
async function updateTranscriptAccess(videoId) {
  try {
    // First get current count
    const { data: current } = await supabase
      .from('video_transcripts')
      .select('access_count')
      .eq('video_id', videoId)
      .single();
    
    // Then update
    const { error } = await supabase
      .from('video_transcripts')
      .update({
        last_accessed: new Date().toISOString(),
        access_count: (current?.access_count || 0) + 1
      })
      .eq('video_id', videoId);
    
    if (error) throw error;
    
    console.log(`📊 Updated transcript access: ${videoId}`);
  } catch (error) {
    console.error('Update transcript access error:', error);
  }
}

// ============================================
// VIDEO SUMMARY OPERATIONS
// ============================================

/**
 * Check if summary exists in Supabase
 */
async function getSummary(videoId, aiProvider, length = 'medium') {
  try {
    console.log(`🔍 Checking Supabase for summary: ${videoId} - ${aiProvider} - ${length}`);
    
    const { data, error } = await supabase
      .from('video_summaries')
      .select('*')
      .eq('video_id', videoId)
      .eq('ai_provider', aiProvider)
      .eq('length', length)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`❌ Summary not found in Supabase: ${videoId}`);
        return null;
      }
      throw error;
    }
    
    console.log(`✅ Summary found in Supabase: ${videoId} - ${aiProvider} - ${length}`);
    return data;
  } catch (error) {
    console.error('Supabase getSummary error:', error);
    return null;
  }
}

/**
 * Store summary in Supabase
 */
async function storeSummary(summaryData) {
  try {
    const {
      video_id,
      video_title,
      channel_name,
      duration,
      ai_provider,
      model,
      length = 'medium',
      language = 'en',
      text,
      key_points = [],
      chapters = [],
      tags = [],
      sentiment,
      word_count,
      processing_time,
      tokens_used,
      cost_usd,
      generated_by_user_id,
      generated_by_user_email
    } = summaryData;
    
    console.log(`💾 Storing summary in Supabase: ${video_id} - ${ai_provider} - ${length}`);
    
    const { data, error } = await supabase
      .from('video_summaries')
      .upsert({
        video_id,
        video_title,
        channel_name,
        duration,
        ai_provider,
        model,
        length,
        language,
        text,
        key_points,
        chapters,
        tags,
        sentiment,
        word_count: word_count || (text ? text.split(/\s+/).length : 0),
        processing_time,
        tokens_used,
        cost_usd,
        generated_by_user_id,
        generated_by_user_email,
        generated_at: new Date().toISOString(),
        last_accessed: new Date().toISOString(),
        access_count: 1
      }, {
        onConflict: 'video_id,ai_provider,length',
        ignoreDuplicates: false
      })
      .select()
      .single();
    
    if (error) throw error;
    
    console.log(`✅ Summary stored in Supabase: ${video_id}`);
    return data;
  } catch (error) {
    console.error('Supabase storeSummary error:', error);
    throw error;
  }
}

/**
 * Update summary access stats
 */
async function updateSummaryAccess(videoId, aiProvider, length) {
  try {
    const { error } = await supabase
      .from('video_summaries')
      .update({
        last_accessed: new Date().toISOString(),
        access_count: supabase.raw('access_count + 1')
      })
      .eq('video_id', videoId)
      .eq('ai_provider', aiProvider)
      .eq('length', length);
    
    if (error) throw error;
    
    console.log(`📊 Updated summary access: ${videoId}`);
  } catch (error) {
    console.error('Update summary access error:', error);
  }
}

// ============================================
// STATISTICS & ANALYTICS
// ============================================

/**
 * Get cache statistics from Supabase
 */
async function getCacheStats() {
  try {
    // Get transcript stats
    const { data: transcriptStats, error: tError } = await supabase
      .from('video_transcripts')
      .select('video_id', { count: 'exact', head: true });
    
    // Get summary stats
    const { data: summaryStats, error: sError } = await supabase
      .from('video_summaries')
      .select('video_id', { count: 'exact', head: true });
    
    // Get most accessed videos
    const { data: popular, error: pError } = await supabase
      .from('video_summaries')
      .select('video_id, video_title, channel_name, access_count')
      .order('access_count', { ascending: false })
      .limit(10);
    
    return {
      total_transcripts: transcriptStats?.length || 0,
      total_summaries: summaryStats?.length || 0,
      most_popular: popular || []
    };
  } catch (error) {
    console.error('Get cache stats error:', error);
    return null;
  }
}

/**
 * Get trending videos (accessed in last 24 hours)
 */
async function getTrendingVideos(limit = 10) {
  try {
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);
    
    const { data, error } = await supabase
      .from('video_summaries')
      .select('video_id, video_title, channel_name, access_count, last_accessed')
      .gte('last_accessed', last24Hours.toISOString())
      .order('access_count', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Get trending videos error:', error);
    return [];
  }
}

/**
 * Clean up old cache entries (older than 6 months)
 */
async function cleanupOldCache() {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    // Delete old transcripts
    const { error: tError } = await supabase
      .from('video_transcripts')
      .delete()
      .lt('last_accessed', sixMonthsAgo.toISOString());
    
    // Delete old summaries
    const { error: sError } = await supabase
      .from('video_summaries')
      .delete()
      .lt('last_accessed', sixMonthsAgo.toISOString());
    
    console.log('✅ Cleaned up old cache entries from Supabase');
    return true;
  } catch (error) {
    console.error('Cleanup old cache error:', error);
    return false;
  }
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Transcript operations
  getTranscript,
  storeTranscript,
  updateTranscriptAccess,
  
  // Summary operations
  getSummary,
  storeSummary,
  updateSummaryAccess,
  
  // Statistics
  getCacheStats,
  getTrendingVideos,
  cleanupOldCache
};