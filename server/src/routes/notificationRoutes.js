const express = require('express');
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All notification routes require authentication
router.use(authMiddleware);

router.get('/', notificationController.getNotifications); //working
router.get('/unread/count', notificationController.getUnreadCount); //working
router.put('/:id/read', notificationController.markAsRead); //working
router.put('/read/all', notificationController.markAllAsRead); //working
router.delete('/:id', notificationController.deleteNotification); //working

module.exports = router;
