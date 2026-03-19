const express = require('express');
const sentimentAnalysisController = require('../controllers/sentimentAnalysis');

const router = express.Router();

router.post('/analyze', sentimentAnalysisController.getSentimentAnalysis);

module.exports = router;
