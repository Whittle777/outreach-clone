const express = require('express');
const AIGenerator = require('../services/aiGenerator');

const router = express.Router();
const aiGenerator = new AIGenerator();

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

module.exports = router;
