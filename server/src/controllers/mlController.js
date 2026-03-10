const Report = require('../models/Report');
const mlService = require('../services/mlService');

// ============================================================================
// VALIDATE CATEGORY HANDLER
// ============================================================================

/**
 * @desc Validate if text matches a category
 * @route POST /api/ml/validate-category
 * @access Public
 */
exports.validateCategory = async (req, res, next) => {
  try {
    const { text, category } = req.body;

    // Validation: Check required fields
    if (!text || !category) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: text and category',
        success: false
      });
    }

    // Text validation
    if (typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Text must be a non-empty string',
        success: false
      });
    }

    // Category validation
    const validCategories = ['scam', 'danger'];
    if (typeof category !== 'string' || !validCategories.includes(category.toLowerCase())) {
      return res.status(400).json({
        status: 'error',
        message: `Category must be one of: ${validCategories.join(', ')}`,
        success: false
      });
    }

    console.log(`[mlController] Validate Category - Text: "${text.substring(0, 50)}...", Category: "${category}"`);

    // Call ML service with text and category
    const result = await mlService.validateCategory(text, category);

    // Check if service call was successful
    if (!result.success) {
      return res.status(503).json({
        status: 'error',
        message: result.message,
        error: result.error,
        success: false
      });
    }

    // Return successful validation result
    res.status(200).json({
      status: 'success',
      data: {
        valid: result.valid,
        confidence: result.confidence,
        message: result.message
      },
      success: true
    });
  } catch (error) {
    console.error('[mlController] Validate Category Error:', error.message);
    next(error);
  }
};

// ============================================================================
// SUMMARIZE NEARBY REPORTS HANDLER
// ============================================================================

/**
 * @desc Summarize nearby reports received from frontend
 * @route POST /api/ml/summarize-all
 * @access Public
 * @note Frontend sends only: title, description, category, createdAt
 * @note Location mention is generic ("this location") - user sees it on map
 */
exports.summarizeAll = async (req, res, next) => {
  try {
    const { latitude, longitude, limit = 50 } = req.body;

    // Validation: Check required location parameters
    if (!latitude || !longitude) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: latitude and longitude',
        success: false
      });
    }

    // Validate coordinates
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid coordinates. Longitude: [-180, 180], Latitude: [-90, 90]'
      });
    }

    // Fetch nearby reports within 1km radius
    const reports = await Report.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: 5000
        }
      },
      status: 'active'
    })
      .limit(parseInt(limit))
      .sort('-createdAt')
      .lean();

    if (reports.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No reports found within 5km radius',
        success: false
      });
    }

    // Format reports for ML service
    const formattedReports = reports.map(report => ({
      title: report.title,
      description: report.description,
      category: report.category,
      createdAt: report.createdAt
    }));

    console.log(`[mlController] Summarize Nearby - Processing ${formattedReports.length} reports within 5km`);

    // Call ML service to generate comprehensive summary
    const result = await mlService.summarizeAll(formattedReports);

    if (!result.success) {
      return res.status(503).json({
        status: 'error',
        message: result.message,
        success: false
      });
    }

    res.status(200).json({
      status: 'success',
      nearby: true,
      radiusMeters: 5000,
      reportCount: reports.length,
      data: {
        summary: result.summary,
        statistics: result.statistics
      },
      success: true
    });
  } catch (error) {
    console.error('[mlController] Summarize Nearby Error:', error.message);
    next(error);
  }
};

// ============================================================================
// ASK RAG QUESTION HANDLER
// ============================================================================

/**
 * @desc Ask RAG question about nearby reports
 * @route POST /api/ml/ask-rag
 * @access Public
 */
exports.askRag = async (req, res, next) => {
  try {
    const { question, latitude, longitude, limit = 20 } = req.body;

    // Validation: Check required fields
    if (!question) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a question',
        success: false
      });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: latitude and longitude',
        success: false
      });
    }

    // Validate coordinates
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid coordinates. Longitude: [-180, 180], Latitude: [-90, 90]',
        success: false
      });
    }

    // Fetch nearby reports within 5km radius
    const reports = await Report.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: 5000
        }
      },
      status: 'active'
    })
      .limit(parseInt(limit))
      .sort('-createdAt')
      .lean();

    if (reports.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No reports found within 1km radius',
        success: false
      });
    }

    // Format reports for RAG service
    const formattedReports = reports.map(report => ({
      title: report.title,
      description: report.description,
      category: report.category,
      createdAt: report.createdAt,
      upvotes: report.upvotes?.length || 0,
      downvotes: report.downvotes?.length || 0
    }));

    console.log(`[mlController] Ask RAG - Question: "${question.substring(0, 50)}...", Location: [${lat}, ${lng}], Reports: ${reports.length}`);

    // Call ML service with formatted reports and question
    const result = await mlService.askRag(formattedReports, question);

    if (!result.success) {
      return res.status(503).json({
        status: 'error',
        message: result.message || 'RAG service error',
        success: false
      });
    }

    res.status(200).json({
      status: 'success',
      reportCount: reports.length,
      data: result.data,
      success: true
    });
  } catch (error) {
    console.error('[mlController] Ask RAG Error:', error.message);
    next(error);
  }
};
