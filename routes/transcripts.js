const express = require('express');
const router = express.Router();
const transcriptService = require('../services/transcriptService');
const sentimentAnalysisService = require('../services/sentimentAnalysisService');

router.get('/transcripts/:transcriptionId', async (req, res) => {
  try {
    const transcriptionId = req.params.transcriptionId;
    const transcript = await transcriptService.getTranscript(transcriptionId);
    res.json(transcript);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/sentiment/:transcriptionId', async (req, res) => {
  try {
    const transcriptionId = req.params.transcriptionId;
    const sentimentAnalysis = await sentimentAnalysisService.analyze(transcriptionId);
    res.json(sentimentAnalysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
