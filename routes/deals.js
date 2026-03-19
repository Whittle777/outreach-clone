const express = require('express');
const router = express.Router();
const dealsService = require('../services/deals');
const dealHealthService = require('../services/dealHealthService');

router.post('/', async (req, res) => {
  try {
    const deal = await dealsService.createDeal(req.body);
    res.status(201).json(deal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const deal = await dealsService.getDealById(req.params.id);
    if (deal) {
      res.json(deal);
    } else {
      res.status(404).json({ error: 'Deal not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const deal = await dealsService.updateDeal(req.params.id, req.body);
    res.json(deal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await dealsService.deleteDeal(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const deals = await dealsService.getAllDeals();
    res.json(deals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/top-opportunities', async (req, res) => {
  try {
    const topOpportunities = await dealHealthService.getTopOpportunities();
    res.json(topOpportunities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
