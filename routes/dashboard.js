const express = require('express');
const router = express.Router();
const metricsService = require('../services/metricsService');

router.get('/', async (req, res) => {
  try {
    const conversionRates = await metricsService.getConversionRates();
    const winLossStatistics = await metricsService.getWinLossStatistics();
    res.render('dashboard', { conversionRates, winLossStatistics });
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
