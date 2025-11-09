const axios = require('axios');

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:5000';

/**
 * Call Python backend to generate summary
 */
async function generateSummaryFromPython(videoId, summaryType = 'medium') {
  try {
    console.log(`🐍 Calling Python backend for ${summaryType} summary: ${videoId}`);
    
    const endpoint = `${PYTHON_BACKEND_URL}/api/summary/${summaryType}`;
    
    const response = await axios.post(endpoint, {
      video_id: videoId
    }, {
      timeout: 60000, // 60 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.data.success) {
      throw new Error('Python backend returned unsuccessful response');
    }

    console.log(`✅ Python backend generated ${summaryType} summary successfully`);
    return response.data;

  } catch (error) {
    console.error('Python backend error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Python backend is not running');
    }
    
    if (error.response) {
      throw new Error(`Python backend error: ${error.response.status} - ${error.response.data?.error || 'Unknown error'}`);
    }
    
    throw error;
  }
}

/**
 * Transform Python response to match our schema
 */
function transformPythonResponse(pythonData, videoId, summaryType) {
  const summary = pythonData.summary_data;
  
  // Handle different text formats
  let summaryText = '';
  if (summaryType === 'detailed') {
    summaryText = summary.detailed_summary || summary.executive_summary || summary.summary;
  } else {
    summaryText = summary.summary || summary.detailed_summary || summary.executive_summary;
  }
  
  // Handle main_topics (can be string array or object array)
  let mainTopics = [];
  if (Array.isArray(summary.main_topics)) {
    mainTopics = summary.main_topics.map(topic => {
      if (typeof topic === 'string') return topic;
      if (typeof topic === 'object' && topic.topic) return topic.topic;
      return '';
    }).filter(Boolean);
  } else if (summary.main_topic) {
    // For SHORT summaries with singular main_topic
    mainTopics = [summary.main_topic];
  }
  
  return {
    video_id: videoId,
    video_title: pythonData.video_title,
    channel_name: pythonData.metadata?.channel_name,
    language: pythonData.metadata?.language || 'en',
    word_count: pythonData.metadata?.word_count,
    
    // Core summary data
    text: summaryText,
    summary_type: summaryType,
    
    // Key fields
    key_points: summary.key_points || [],
    key_takeaways: summary.key_takeaways || [],
    main_topics: mainTopics,
    
    // Additional metadata
    content_type: summary.content_type || null,
    target_audience: summary.target_audience || null,
    duration_estimate: summary.duration_estimate || null,
    difficulty_level: summary.difficulty_level || null,
    prerequisites: summary.prerequisites || null,
    
    // Detailed summary specific
    timestamps: summary.timestamps || [],
    practical_applications: summary.practical_applications || [],
    
    // Currently unused but should be populated
    chapters: [], // TODO: Implement chapter extraction
    tags: [],     // TODO: Implement tag generation
    
    // Compression stats
    compression_stats: pythonData.compression_stats || {},
    
    // Caching info
    cached_transcript: pythonData.cached_transcript
  };
}

module.exports = {
  generateSummaryFromPython,
  transformPythonResponse
};