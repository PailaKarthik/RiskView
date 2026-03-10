const Notification = require('../models/Notification');

// @desc Get all notifications for current user
// @route GET /api/notifications
// @access Private
exports.getNotifications = async (req, res, next) => {
  try {
    const { limit = 20, skip = 0 } = req.query;

    const notifications = await Notification.find({ userId: req.user.id })
      .populate('userId', 'fullName email')
      .populate('relatedReport', 'title category')
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort('-createdAt');

    const total = await Notification.countDocuments({ userId: req.user.id });

    res.status(200).json({
      status: 'success',
      count: notifications.length,
      total,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get unread notifications count
// @route GET /api/notifications/unread/count
// @access Private
exports.getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await Notification.countDocuments({
      userId: req.user.id,
      isRead: false
    });

    res.status(200).json({
      status: 'success',
      unreadCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc Mark notification as read
// @route PUT /api/notifications/:id/read
// @access Private
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }

    // Check if user owns this notification
    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized'
      });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      status: 'success',
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

// @desc Mark all notifications as read
// @route PUT /api/notifications/read/all
// @access Private
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete notification
// @route DELETE /api/notifications/:id
// @access Private
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }

    // Check if user owns this notification
    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized'
      });
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Notification deleted'
    });
  } catch (error) {
    next(error);
  }
};

// @desc Create notification (internal use)
// @route POST /api/notifications (internal)
// @access Private (internal)
exports.createNotification = async (userId, message, type, relatedReport) => {
  try {
    const notification = await Notification.create({
      userId,
      message,
      type,
      relatedReport
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};
