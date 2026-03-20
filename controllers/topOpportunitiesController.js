const DealService = require('../services/dealService');

class TopOpportunitiesController {
  static async getTopOpportunities(req, res) {
    try {
      const topOpportunities = await DealService.getHighValueDealsWithinRange(100000, 1000000, '2023-01-01', '2023-12-31');
      res.status(200).json(topOpportunities);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch top opportunities' });
    }
  }
}

module.exports = TopOpportunitiesController;
