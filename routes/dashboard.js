const express = require('express');
const router = express.Router();
const { getConversionRates, getWinLossStatistics } = require('../services/dashboardService');

router.get('/', async (req, res) => {
  try {
    const conversionRates = await getConversionRates();
    const winLossStatistics = await getWinLossStatistics();
    res.render('dashboard', { conversionRates, winLossStatistics });
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
