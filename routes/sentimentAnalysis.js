const express = require('express');
const sentimentAnalysisController = require('../controllers/sentimentAnalysis');

const router = express.Router();

router.post('/analyze', sentimentAnalysisController.getSentimentAnalysis);
router.get('/results/:transcriptionId', sentimentAnalysisController.getSentimentAnalysisResults);
router.get('/results', sentimentAnalysisController.getAllSentimentAnalysisResults); // New route to get all sentiment analysis results

module.exports = router;
