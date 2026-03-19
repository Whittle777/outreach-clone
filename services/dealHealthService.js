const DealHealthScore = require('../models/dealHealthScore');
const logger = require('../services/logger');
const prospectService = require('../services/prospectService');

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

  async getTopOpportunities() {
    try {
      const prospects = await prospectService.getAllProspects();
      const dealHealthScores = await Promise.all(
        prospects.map(prospect => this.calculateDealHealthScore(prospect.id, prospect.metadata))
      );

      dealHealthScores.sort((a, b) => b.score - a.score);

      const topOpportunities = dealHealthScores.slice(0, 10); // Fetch top 10 opportunities
      return topOpportunities;
    } catch (error) {
      logger.error('Failed to get top opportunities', { error });
      throw error;
    }
  }
}

module.exports = new DealHealthService();
