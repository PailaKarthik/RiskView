const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', authController.register); //working
router.post('/login', authController.login); //working

// Private routes
router.put('/update-push-token', authMiddleware, authController.updatePushToken);
router.get('/me', authMiddleware, authController.getMe); //working

module.exports = router;
