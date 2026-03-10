const Report = require('../models/Report');
const User = require('../models/User');
const Notification = require('../models/Notification');
const mlService = require('../services/mlService');
const pushService = require('../services/pushService');

// Travel mode constants
const REPORT_THRESHOLD = 3;
const NOTIFICATION_COOLDOWN = 30 * 60 * 1000; // 30 minutes
// const RECENT_REPORT_TIMEFRAME = 24 * 60 * 60 * 1000; // 24 hours

// @desc Create a new report
// @route POST /api/reports
// @access Private
exports.createReport = async (req, res, next) => {
  try {
    const { latitude, longitude, category, title, description } = req.body;

    // Validation
    if (!latitude || !longitude || !category || !title || !description) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide all required fields: latitude, longitude, category, title, description'
      });
    }

    // Validate coordinates
    if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid coordinates. Longitude: [-180, 180], Latitude: [-90, 90]'
      });
    }

    // Call ML validation category check (non-blocking, but log if it fails)
    try {
      const mlValidation = await mlService.validateCategory(description, category);
      if (!mlValidation.valid) {
        return res.status(400).json({
          status: 'error',
          message: 'Report validation failed: ' + mlValidation.message
        });
      }
    } catch (mlError) {
      console.warn('ML validation service unavailable, proceeding with report creation');
    }

    // Convert lat/lng to GeoJSON format
    const location = {
      type: 'Point',
      coordinates: [longitude, latitude]
    };

    const report = await Report.create({
      userId: req.user.id,
      location,
      category,
      title,
      description
    });

    const populatedReport = await report.populate('userId', 'fullName email');

    res.status(201).json({
      status: 'success',
      message: 'Report created successfully',
      data: populatedReport
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get reports near location with Travel Mode notification logic
// @route GET /api/reports/nearby?latitude=X&longitude=Y
// @access Private
exports.getReportsNearby = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.query;
    const userId = req.user ? req.user.id : null;

    if (!longitude || !latitude) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide latitude and longitude query parameters'
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

    // Calculate timestamp for last 24 hours
    // const twentyFourHoursAgo = new Date(Date.now() - RECENT_REPORT_TIMEFRAME);

    // Find reports within 1000 meters created in last 24 hours
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
      status: 'active',
      // createdAt: { $gte: twentyFourHoursAgo }
    }).populate('userId', 'fullName email').sort('-createdAt');

    // Travel Mode notification logic
    if (userId && reports.length >= REPORT_THRESHOLD) {
      try {
        // Count reports by category
        const categoryCounts = {
          scam: 0,
          danger: 0
        };

        reports.forEach(report => {
          if (report.category === 'scam') {
            categoryCounts.scam += 1;
          } else if (report.category === 'danger') {
            categoryCounts.danger += 1;
          }
        });

        // Check if user received notification recently
        const recentNotificationWindow = new Date(Date.now() - NOTIFICATION_COOLDOWN);
        const recentNotification = await Notification.findOne({
          userId,
          createdAt: { $gte: recentNotificationWindow }
        });
        console.log(recentNotification ? `Recent notification found for user ${userId}` : `No recent notification for user ${userId}`);
        if (!recentNotification) {
          // Create summarized notification message
          const scamCount = categoryCounts.scam > 0 ? `Scam: ${categoryCounts.scam}` : null;
          const dangerCount = categoryCounts.danger > 0 ? `Danger: ${categoryCounts.danger}` : null;
          const categoryBreakdown = [scamCount, dangerCount].filter(Boolean).join(', ');

          const notificationMessage = `High activity alert: ${reports.length} reports detected nearby (${categoryBreakdown})`;

          // Send push notification
          await pushService.sendPushNotification(userId,notificationMessage);
          // Save notification in database
          await Notification.create({
            userId,
            message: notificationMessage,
            type: categoryCounts.danger > categoryCounts.scam ? 'danger' : 'scam',
            relatedReport: null,
            isRead: false
          });

          console.log(`✓ Notification created for user ${userId}: ${notificationMessage}`);
        }
      } catch (notificationError) {
        console.error('Notification error:', notificationError.message);
      }
    }

    res.status(200).json({
      status: 'success',
      count: reports.length,
      data: reports
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get all reports
// @route GET /api/reports
// @access Public
exports.getAllReports = async (req, res, next) => {
  try {
    const { category, status = 'active', limit = 20, skip = 0 } = req.query;

    let filter = { status };
    if (category) {
      filter.category = category;
    }
    

    const reports = await Report.find(filter)
      .populate('userId', 'fullName email')
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort('-createdAt');

    const total = await Report.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      count: reports.length,
      total,
      data: reports
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get report by ID
// @route GET /api/reports/:id
// @access Public
exports.getReportById = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('userId', 'fullName email')
      .populate('upvotes', 'fullName email')
      .populate('downvotes', 'fullName email');

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: report
    });
  } catch (error) {
    next(error);
  }
};

// @desc Upvote a report
// @route POST /api/reports/:id/upvote
// @access Private
exports.upvoteReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }

    const userIdString = req.user.id.toString();
    const userUpvoted = report.upvotes.some(id => id.toString() === userIdString);

    // If user already upvoted, do nothing
    if (!userUpvoted) {
      // Remove from downvotes if user already downvoted
      report.downvotes = report.downvotes.filter(
        id => id.toString() !== userIdString
      );

      // Add to upvotes
      report.upvotes.push(req.user.id);

      await report.save();
    }

    res.status(200).json({
      status: 'success',
      upvotes: report.upvotes.length,
      downvotes: report.downvotes.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc Downvote a report
// @route POST /api/reports/:id/downvote
// @access Private
exports.downvoteReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }

    const userIdString = req.user.id.toString();
    const userDownvoted = report.downvotes.some(id => id.toString() === userIdString);

    // If user already downvoted, do nothing
    if (!userDownvoted) {
      // Remove from upvotes if user already upvoted
      report.upvotes = report.upvotes.filter(
        id => id.toString() !== userIdString
      );

      // Add to downvotes
      report.downvotes.push(req.user.id);

      await report.save();
    }

    res.status(200).json({
      status: 'success',
      upvotes: report.upvotes.length,
      downvotes: report.downvotes.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete report (only by creator or admin)
// @route DELETE /api/reports/:id
// @access Private
exports.deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }

    // Check if user is the creator
    if (report.userId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this report'
      });
    }

    await Report.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Report deleted'
    });
  } catch (error) {
    next(error);
  }
};
