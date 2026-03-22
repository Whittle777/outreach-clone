const express = require('express');
const router = express.Router();
const PreCallBriefDashboard = require('../services/preCallBriefDashboard');

const preCallBriefDashboard = new PreCallBriefDashboard();

router.get('/generate/:prospectId', async (req, res) => {
  try {
    const prospectId = req.params.prospectId;
    const preCallBrief = await preCallBriefDashboard.generatePreCallBrief(prospectId);
    res.json(preCallBrief);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
