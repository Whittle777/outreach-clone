const dealHealthService = require('../services/dealHealthService');

class DealHealthController {
  async getDashboardData(req, res) {
    try {
      const dealHealthScores = await dealHealthService.getTopOpportunities();
      const atRiskDeals = await dealHealthService.getAtRiskDeals();
      res.json({ dealHealthScores, atRiskDeals });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  }
}

module.exports = new DealHealthController();
