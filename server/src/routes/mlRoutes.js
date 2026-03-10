const express = require('express');
const mlController = require('../controllers/mlController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);
// Validate if text matches a category
router.post('/validate-category', mlController.validateCategory); //working

// Summarize all reports with aggregated analysis
router.post('/summarize-all', mlController.summarizeAll); //working

// Ask RAG question about reports
router.post('/ask-rag', mlController.askRag) //working

module.exports = router;