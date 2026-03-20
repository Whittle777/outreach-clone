const express = require('express');
const router = express.Router();
const DealHealthScoreService = require('../services/dealHealthScore');
const Prospect = require('../models/Prospect'); // Assuming there is a Prospect model

// Get deal health score for a prospect
router.get('/:prospectId', async (req, res) => {
  try {
    const prospect = await Prospect.findById(req.params.prospectId);
    if (!prospect) {
      return res.status(404).json({ message: 'Prospect not found' });
    }

    const score = DealHealthScoreService.calculate(prospect);
    res.json({ prospectId: prospect.id, score });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving deal health score', error: error.message });
  }
});

// Update deal health score for a prospect
router.put('/:prospectId', async (req, res) => {
  try {
    const prospect = await Prospect.findById(req.params.prospectId);
    if (!prospect) {
      return res.status(404).json({ message: 'Prospect not found' });
    }

    // Assuming the request body contains the updated prospect data
    const updatedProspect = await Prospect.findByIdAndUpdate(req.params.prospectId, req.body, { new: true });

    const score = DealHealthScoreService.calculate(updatedProspect);
    res.json({ prospectId: updatedProspect.id, score });
  } catch (error) {
    res.status(500).json({ message: 'Error updating deal health score', error: error.message });
  }
});

// Get top opportunities based on Deal Health Scores
router.get('/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const topOpportunities = await DealHealthScoreService.getTopOpportunities(limit);
    res.json(topOpportunities);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving top opportunities', error: error.message });
  }
});

module.exports = router;
