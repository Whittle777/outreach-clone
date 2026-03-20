const express = require('express');
const AIGenerator = require('../services/aiGenerator');
const ConversionRateService = require('../services/conversionRateService');

const router = express.Router();
const aiGenerator = new AIGenerator();
const conversionRateService = new ConversionRateService();

router.post('/generate-call-goal', async (req, res) => {
  try {
    const prospectData = req.body;
    const callGoal = await aiGenerator.generateCallGoal(prospectData);
    res.json({ callGoal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/calculate-confidence-score', async (req, res) => {
  try {
    const transcript = req.body.transcript;
    const confidenceScore = await aiGenerator.calculateConfidenceScore(transcript);
    res.json({ confidenceScore });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/conversion-rates-by-sales-stage', async (req, res) => {
  try {
    const conversionRates = await conversionRateService.analyzeConversionRatesBySalesStage();
    res.json({ conversionRates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
