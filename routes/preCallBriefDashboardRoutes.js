const express = require('express');
const router = express.Router();
const PreCallBriefDashboard = require('../services/preCallBriefDashboard');
const preCallBriefDashboard = new PreCallBriefDashboard();

router.get('/pre-call-brief/:prospectId', async (req, res) => {
  try {
    const prospectId = req.params.prospectId;
    const preCallBrief = await preCallBriefDashboard.generatePreCallBrief(prospectId);

    if (preCallBrief) {
      res.json(preCallBrief);
    } else {
      res.status(404).json({ message: 'Pre-Call Brief not available' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error generating pre-call brief', error: error.message });
  }
});

module.exports = router;
