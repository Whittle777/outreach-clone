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

  async getConversionRateBySalesStage(salesStage) {
    try {
      const prospects = await prospectService.getProspectsBySalesStage(salesStage);
      if (propects.length === 0) {
        return 0;
      }

      const convertedProspects = prospects.filter(prospect => prospect.status === 'Converted');
      const conversionRate = (convertedProspects.length / prospects.length) * 100;
      return conversionRate;
    } catch (error) {
      logger.error('Failed to get conversion rate by sales stage', { salesStage, error });
      throw error;
    }
  }
}

module.exports = new DealHealthService();
