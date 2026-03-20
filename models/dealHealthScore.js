const prisma = require('../services/database');
const logger = require('../services/logger');

class DealHealthScore {
  static async create(dealHealthScoreData) {
    try {
      const result = await prisma.dealHealthScore.create({
        data: dealHealthScoreData,
      });
      logger.log('DealHealthScore created successfully', result);
      return result;
    } catch (error) {
      logger.error('Error creating DealHealthScore', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const result = await prisma.dealHealthScore.findUnique({
        where: { id: parseInt(id) },
      });
      if (result) {
        logger.log('DealHealthScore retrieved successfully', result);
      } else {
        logger.log('DealHealthScore not found', { id });
      }
      return result;
    } catch (error) {
      logger.error('Error retrieving DealHealthScore', error);
      throw error;
    }
  }

  static async update(id, dealHealthScoreData) {
    try {
      const result = await prisma.dealHealthScore.update({
        where: { id: parseInt(id) },
        data: dealHealthScoreData,
      });
      logger.log('DealHealthScore updated successfully', result);
      return result;
    } catch (error) {
      logger.error('Error updating DealHealthScore', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const result = await prisma.dealHealthScore.delete({
        where: { id: parseInt(id) },
      });
      logger.log('DealHealthScore deleted successfully', result);
      return result;
    } catch (error) {
      logger.error('Error deleting DealHealthScore', error);
      throw error;
    }
  }

  static async getAll() {
    try {
      const result = await prisma.dealHealthScore.findMany();
      logger.log('All DealHealthScores retrieved successfully', result);
      return result;
    } catch (error) {
      logger.error('Error retrieving all DealHealthScores', error);
    }
  }
}

module.exports = DealHealthScore;
