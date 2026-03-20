const DealHealthScoreService = require('../services/dealHealthScore');
const logger = require('../services/logger');

class DealHealthScoreController {
  static async calculateAndSave(req, res) {
    try {
      const prospect = req.body;
      const dealHealthScore = await DealHealthScoreService.calculateAndSave(prospect);
      res.status(200).json(dealHealthScore);
    } catch (error) {
      logger.error('Error in calculateAndSave', error);
      res.status(500).json({ error: 'Failed to calculate and save DealHealthScore' });
    }
  }
}

module.exports = DealHealthScoreController;
