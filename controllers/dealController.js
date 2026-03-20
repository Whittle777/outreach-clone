const DealService = require('../services/dealService');

class DealController {
  static async createDeal(req, res) {
    try {
      const dealData = req.body;
      const deal = await DealService.create(dealData);
      res.status(201).json(deal);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getDealById(req, res) {
    try {
      const id = req.params.id;
      const deal = await DealService.findById(id);
      if (deal) {
        res.status(200).json(deal);
      } else {
        res.status(404).json({ error: 'Deal not found' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateDeal(req, res) {
    try {
      const id = req.params.id;
      const dealData = req.body;
      const deal = await DealService.update(id, dealData);
      res.status(200).json(deal);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteDeal(req, res) {
    try {
      const id = req.params.id;
      await DealService.delete(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getAllDeals(req, res) {
    try {
      const deals = await DealService.getAll();
      res.status(200).json(deals);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = DealController;
