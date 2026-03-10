const axios = require('axios');

const ML_SERVICE_URL = process.env.PYTHON_SERVICE_URL;
const TIMEOUT = 10000;

// Get risk score for location
const getRiskScore = async (longitude, latitude, radius = 1000) => {
  try {
    const response = await axios.get(
      `${ML_SERVICE_URL}/api/risk-score`,
      {
        params: {
          longitude,
          latitude,
          radius
        },
        timeout: TIMEOUT
      }
    );

    return response.data;
  } catch (error) {
    console.error('ML Service error (getRiskScore):', error.message);
    throw new Error('Failed to get risk score');
  }
};

// Validate if text matches the given category
const validateCategory = async (text, category) => {
  try {
    // Input validation
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      console.warn('validateCategory: Invalid or empty text provided');
      return {
        valid: false,
        confidence : 0.0,
        message: 'Invalid or empty text provided',
        success: false
      };
    }

    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      console.warn('validateCategory: Invalid or empty category provided');
      return {
        valid: false,
        confidence : 0.0,
        message: 'Invalid or empty category provided',
        success: false
      };
    }

    if (!ML_SERVICE_URL) {
      console.error('PYTHON_SERVICE_URL environment variable not set');
      return {
        valid: null,
        confidence : 0.0,
        message: 'ML service not configured',
        success: false
      };
    }

    console.log(`[validateCategory] Calling ML service - text length: ${text.length}, category: ${category}`);

    // Call Python ML service
    const response = await axios.post(
      `${ML_SERVICE_URL}/api/validate-category`,
      {
        text: text.trim(),
        category: category.trim()
      },
      { 
        timeout: TIMEOUT,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    console.log(`[validateCategory] ML service response:`, response.data);

    // Return properly formatted response
    return {
      valid: response.data.valid,
      confidence: response.data.confidence,
      message: response.data.message,
      success: true
    };
  } catch (error) {
    console.error('ML Service error (validateCategory):', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error(`ML Service connection refused at ${ML_SERVICE_URL}`);
    } else if (error.response) {
      console.error(`ML Service responded with status ${error.response.status}`);
    }

    return {
      valid: null,
      category,
      message: `Validation service error: ${error.message}`,
      success: false,
      error: error.message
    };
  }
};

// Summarize text content
const summarize = async (text) => {
  try {
    if (!text) {
      return {
        summary: '',
        error: 'No text provided'
      };
    }

    const response = await axios.post(
      `${ML_SERVICE_URL}/api/summarize`,
      { text },
      { timeout: TIMEOUT }
    );

    return response.data;
  } catch (error) {
    console.error('ML Service error (summarize):', error.message);
    return {
      summary: text.substring(0, 150),
      error: 'Summarization service unavailable, returning truncated text'
    };
  }
};

// Summarize all reports with aggregated analysis
const summarizeAll = async (reports) => {
  try {
    if (!reports || !Array.isArray(reports) || reports.length === 0) {
      return {
        summary: '',
        statistics: {},
        success: false,
        message: 'No reports provided'
      };
    }

    if (!ML_SERVICE_URL) {
      console.error('PYTHON_SERVICE_URL environment variable not set');
      return {
        summary: '',
        statistics: {},
        success: false,
        message: 'ML service not configured'
      };
    }

    console.log(`[summarizeAll] Calling ML service with ${reports.length} reports`);

    const response = await axios.post(
      `${ML_SERVICE_URL}/api/summarize-all`,
      { reports },
      { 
        timeout: TIMEOUT,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    console.log(`[summarizeAll] ML service response received`);

    return {
      summary: response.data.summary,
      statistics: response.data.statistics,
      success: true,
      message: 'Summary generated successfully'
    };
  } catch (error) {
    console.error('ML Service error (summarizeAll):', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error(`ML Service connection refused at ${ML_SERVICE_URL}`);
    } else if (error.response) {
      console.error(`ML Service responded with status ${error.response.status}:`, error.response.data);
    }

    return {
      summary: '',
      statistics: {},
      success: false,
      message: `Summarization service error: ${error.message}`,
      error: error.message
    };
  }
};

// Ask RAG (Retrieval Augmented Generation) question about reports
const askRag = async (reportData, question) => {
  try {
    if (!reportData || reportData.length === 0) {
      return {
        success: false,
        message: 'No report data available to query',
        data: {
          answer: 'No reports found in this location',
          retrieved_chunks: []
        }
      };
    }

    if (!question) {
      return {
        success: false,
        message: 'No question provided',
        data: {
          answer: 'Please provide a question',
          retrieved_chunks: []
        }
      };
    }

    if (!ML_SERVICE_URL) {
      console.error('PYTHON_SERVICE_URL environment variable not set');
      return {
        success: false,
        message: 'ML service not configured',
        data: {
          answer: 'ML service unavailable',
          retrieved_chunks: []
        }
      };
    }

    // Format reports as context for RAG service
    const contextText = reportData
      .map((report, i) => 
        `Report ${i + 1}: ${report.title} (${report.category})\n` +
        `Description: ${report.description}\n` +
        `Date: ${report.createdAt}\n` +
        `Upvotes: ${report.upvotes || 0}, Downvotes: ${report.downvotes || 0}`
      )
      .join('\n\n');

    console.log(`[askRag] Calling ML service - question: "${question.substring(0, 50)}...", reports: ${reportData.length}`);

    // Call Python ML service with context and question
    const response = await axios.post(
      `${ML_SERVICE_URL}/api/rag`,
      {
        context: contextText,
        question: question.trim(),
        k: 3
      },
      { 
        timeout: TIMEOUT,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    console.log(`[askRag] ML service response received`);

    return {
      success: true,
      message: 'Query processed successfully',
      data: {
        answer: response.data.answer,
        retrieved_chunks: response.data.retrieved_chunks || [],
        sources_used: response.data.sources_used || 0
      }
    };
  } catch (error) {
    console.error('ML Service error (askRag):', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.error(`ML Service connection refused at ${ML_SERVICE_URL}`);
    } else if (error.response) {
      console.error(`ML Service responded with status ${error.response.status}:`, error.response.data);
    }

    return {
      success: false,
      message: `RAG service error: ${error.message}`,
      data: {
        answer: 'Unable to process query at this time',
        retrieved_chunks: [],
        error: error.message
      }
    };
  }
};

module.exports = {
  getRiskScore,
  validateCategory,
  summarizeAll,
  askRag
};
