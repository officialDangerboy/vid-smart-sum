const { supabase } = require('../config/supabase');

/**
 * Storage Service - Wrapper for external storage (Supabase)
 * Handles summaries and transcripts storage/retrieval
 */

class StorageService {
  /**
   * Save summary to external storage
   * @param {string} videoId - YouTube video ID
   * @param {object} summaryData - Summary content and metadata
   */
  async saveSummary(videoId, summaryData) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('video_summaries')
      .upsert({
        video_id: videoId,
        summary_text: summaryData.text,
        key_points: summaryData.key_points || [],
        chapters: summaryData.chapters || [],
        metadata: {
          ai_provider: summaryData.ai_provider,
          model: summaryData.model,
          length: summaryData.length,
          word_count: summaryData.word_count,
          processing_time: summaryData.processing_time,
          generated_at: new Date().toISOString()
        }
      }, {
        onConflict: 'video_id'
      });

    if (error) {
      console.error('❌ Supabase save error:', error);
      throw error;
    }

    console.log('✅ Summary saved to Supabase:', videoId);
    return data;
  }

  /**
   * Get summary from external storage
   * @param {string} videoId - YouTube video ID
   */
  async getSummary(videoId) {
    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from('video_summaries')
      .select('*')
      .eq('video_id', videoId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found - this is okay
        console.log('❌ Summary not found in Supabase:', videoId);
        return null;
      }
      console.error('❌ Supabase fetch error:', error);
      return null;
    }

    if (data) {
      console.log('✅ Summary found in Supabase:', videoId);
      return {
        text: data.summary_text,
        key_points: data.key_points,
        chapters: data.chapters,
        metadata: data.metadata,
        cached: true
      };
    }

    return null;
  }

  /**
   * Save transcript to external storage
   * @param {string} videoId - YouTube video ID
   * @param {object} transcriptData - Transcript content
   */
  async saveTranscript(videoId, transcriptData) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('video_transcripts')
      .upsert({
        video_id: videoId,
        transcript_text: transcriptData.full_text,
        segments: transcriptData.segments || [],
        metadata: {
          language: transcriptData.language || 'en',
          word_count: transcriptData.word_count,
          source: transcriptData.source,
          generated_at: new Date().toISOString()
        }
      }, {
        onConflict: 'video_id'
      });

    if (error) {
      console.error('❌ Supabase transcript save error:', error);
      throw error;
    }

    console.log('✅ Transcript saved to Supabase:', videoId);
    return data;
  }

  /**
   * Get transcript from external storage
   * @param {string} videoId - YouTube video ID
   */
  async getTranscript(videoId) {
    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from('video_transcripts')
      .select('*')
      .eq('video_id', videoId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('❌ Transcript not found in Supabase:', videoId);
        return null;
      }
      console.error('❌ Supabase transcript fetch error:', error);
      return null;
    }

    if (data) {
      console.log('✅ Transcript found in Supabase:', videoId);
      return {
        full_text: data.transcript_text,
        segments: data.segments,
        metadata: data.metadata,
        cached: true
      };
    }

    return null;
  }

  /**
   * Delete summary from storage
   * @param {string} videoId - YouTube video ID
   */
  async deleteSummary(videoId) {
    if (!supabase) {
      return;
    }

    const { error } = await supabase
      .from('video_summaries')
      .delete()
      .eq('video_id', videoId);

    if (error) {
      console.error('❌ Supabase delete error:', error);
      throw error;
    }

    console.log('🗑️  Summary deleted from Supabase:', videoId);
  }

  /**
   * Delete transcript from storage
   * @param {string} videoId - YouTube video ID
   */
  async deleteTranscript(videoId) {
    if (!supabase) {
      return;
    }

    const { error } = await supabase
      .from('video_transcripts')
      .delete()
      .eq('video_id', videoId);

    if (error) {
      console.error('❌ Supabase transcript delete error:', error);
      throw error;
    }

    console.log('🗑️  Transcript deleted from Supabase:', videoId);
  }

  /**
   * Get storage statistics
   */
  async getStats() {
    if (!supabase) {
      return { summaries: 0, transcripts: 0 };
    }

    const [summariesCount, transcriptsCount] = await Promise.all([
      supabase.from('video_summaries').select('id', { count: 'exact', head: true }),
      supabase.from('video_transcripts').select('id', { count: 'exact', head: true })
    ]);

    return {
      summaries: summariesCount.count || 0,
      transcripts: transcriptsCount.count || 0
    };
  }
}

module.exports = new StorageService();