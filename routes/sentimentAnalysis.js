const express = require('express');
const sentimentAnalysisController = require('../controllers/sentimentAnalysis');

const router = express.Router();

router.post('/analyze', sentimentAnalysisController.getSentimentAnalysis);
router.get('/results/:transcriptionId', sentimentAnalysisController.getSentimentAnalysisResults);

module.exports = router;
