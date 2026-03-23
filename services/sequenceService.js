const { prisma } = require('../prismaClient');
const logger = require('../services/logger');

class SequenceService {
  async getAllSequences(userId) {
    try {
      const sequences = await prisma.sequence.findMany({
        where: { userId },
      });
      logger.log('Sequences retrieved successfully', sequences);
      return sequences;
    } catch (error) {
      logger.error('Error retrieving sequences', error);
      throw error;
    }
  }

  async getSequenceById(sequenceId) {
    try {
      const sequence = await prisma.sequence.findUnique({
        where: { id: sequenceId },
      });
      logger.log('Sequence retrieved successfully', sequence);
      return sequence;
    } catch (error) {
      logger.error('Error retrieving sequence', error);
      throw error;
    }
  }

  async createSequence(sequenceData) {
    try {
      const sequence = await prisma.sequence.create({
        data: sequenceData,
      });
      logger.log('Sequence created successfully', sequence);
      return sequence;
    } catch (error) {
      logger.error('Error creating sequence', error);
      throw error;
    }
  }

  async updateSequence(sequenceId, sequenceData) {
    try {
      const sequence = await prisma.sequence.update({
        where: { id: sequenceId },
        data: sequenceData,
      });
      logger.log('Sequence updated successfully', sequence);
      return sequence;
    } catch (error) {
      logger.error('Error updating sequence', error);
      throw error;
    }
  }

  async deleteSequence(sequenceId) {
    try {
      const sequence = await prisma.sequence.delete({
        where: { id: sequenceId },
      });
      logger.log('Sequence deleted successfully', sequence);
      return sequence;
    } catch (error) {
      logger.error('Error deleting sequence', error);
      throw error;
    }
  }

  async updateSequenceState(sequenceId, state) {
    try {
      const sequence = await prisma.sequence.update({
        where: { id: sequenceId },
        data: { state },
      });
      logger.log('Sequence state updated successfully', sequence);
      return sequence;
    } catch (error) {
      logger.error('Error updating sequence state', error);
      throw error;
    }
  }
}

module.exports = new SequenceService();
