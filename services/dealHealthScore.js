const DealHealthScoreCalculator = require('./dealHealthScoreCalculator');
const DealHealthScore = require('../models/dealHealthScore');
const logger = require('../services/logger');

class DealHealthScoreService {
  static async calculateAndSave(prospect) {
    try {
      const score = DealHealthScoreCalculator.calculate(prospect);
      const dealHealthScoreData = {
        prospectId: prospect.id,
        score,
        status: score >= 80 ? 'High' : score >= 50 ? 'Medium' : 'Low',
      };

      const existingDealHealthScore = await DealHealthScore.findById(prospect.id);
      if (existingDealHealthScore) {
        const updatedDealHealthScore = await DealHealthScore.update(existingDealHealthScore.id, dealHealthScoreData);
        logger.log('DealHealthScore updated successfully', updatedDealHealthScore);
        return updatedDealHealthScore;
      } else {
        const newDealHealthScore = await DealHealthScore.create(dealHealthScoreData);
        logger.log('DealHealthScore created successfully', newDealHealthScore);
        return newDealHealthScore;
      }
    } catch (error) {
      logger.error('Error calculating and saving DealHealthScore', error);
      throw error;
    }
  }

  static async getTopOpportunities(limit = 10) {
    try {
      const topOpportunities = await DealHealthScore.findTopOpportunities(limit);
      logger.log('Top opportunities retrieved successfully', topOpportunities);
      return topOpportunities;
    } catch (error) {
      logger.error('Error retrieving top opportunities', error);
    }
  }

  static async getDealHealthScoreById(id) {
    try {
      const dealHealthScore = await DealHealthScore.findById(id);
      if (!dealHealthScore) {
        throw new Error('Deal Health Score not found');
      }
      return dealHealthScore;
    } catch (error) {
      logger.error('Error retrieving deal health score by ID', error);
      throw error;
    }
  }

  static async updateDealHealthScoreById(id, data) {
    try {
      const dealHealthScore = await DealHealthScore.findById(id);
      if (!dealHealthScore) {
        throw new Error('Deal Health Score not found');
      }

      const updatedDealHealthScore = await DealHealthScore.update(id, data);
      logger.log('DealHealthScore updated successfully', updatedDealHealthScore);
      return updatedDealHealthScore;
    } catch (error) {
      logger.error('Error updating deal health score by ID', error);
      throw error;
    }
  }
}

module.exports = DealHealthScoreService;
