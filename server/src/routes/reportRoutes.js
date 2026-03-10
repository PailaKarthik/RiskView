const express = require('express');
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/nearby', authMiddleware,reportController.getReportsNearby); //nearby reports
router.get('/', reportController.getAllReports); //working
router.get('/:id', reportController.getReportById); //working

// Private routes
router.post('/', authMiddleware, reportController.createReport); //working
router.post('/:id/upvote', authMiddleware, reportController.upvoteReport); //working
router.post('/:id/downvote', authMiddleware, reportController.downvoteReport); //working
router.delete('/:id', authMiddleware, reportController.deleteReport); // working

module.exports = router;
