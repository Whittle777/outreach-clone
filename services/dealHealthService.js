const DealHealthScore = require('../models/dealHealthScore');
const logger = require('../services/logger');

class DealHealthService {
  async calculateDealHealthScore(prospectId, metadata) {
    try {
      const score = DealHealthScore.calculateScore(metadata);
      const status = DealHealthScore.determineStatus(score);
      const dealHealthScore = { prospectId, score, status, metadata };
      logger.log('Deal Health Score Calculated', dealHealthScore);
      return dealHealthScore;
    } catch (error) {
      logger.error('Failed to calculate deal health score', { prospectId, metadata, error });
      throw error;
    }
  }
}

module.exports = new DealHealthService();
