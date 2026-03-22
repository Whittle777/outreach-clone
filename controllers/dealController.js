const DealService = require('../services/dealService');

class DealController {
  static async createDeal(req, res) {
    try {
      const deal = await DealService.create(req.body);
      res.status(201).json(deal);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getDealById(req, res) {
    try {
      const deal = await DealService.findById(req.params.id);
      if (deal) {
        res.json(deal);
      } else {
        res.status(404).json({ error: 'Deal not found' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateDeal(req, res) {
    try {
      const deal = await DealService.update(req.params.id, req.body);
      res.json(deal);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteDeal(req, res) {
    try {
      await DealService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getAllDeals(req, res) {
    try {
      const deals = await DealService.getAll();
      res.json(deals);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getHighValueDealsWithinRange(req, res) {
    try {
      const { minValue, maxValue, startDate, endDate } = req.query;
      const deals = await DealService.getHighValueDealsWithinRange(minValue, maxValue, startDate, endDate);
      res.json(deals);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getTopOpportunities(req, res) {
    try {
      const { minValue, maxValue, startDate, endDate } = req.query;
      const deals = await DealService.getTopOpportunities(minValue, maxValue, startDate, endDate);
      res.json(deals);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = DealController;
