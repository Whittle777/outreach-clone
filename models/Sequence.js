const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class Sequence {
  static async getAllSequences(userId) {
    try {
      const sequences = await prisma.sequence.findMany({
        where: { userId },
      });
      return sequences;
    } catch (error) {
      throw error;
    }
  }

  static async getSequenceById(sequenceId) {
    try {
      const sequence = await prisma.sequence.findUnique({
        where: { id: sequenceId },
      });
      return sequence;
    } catch (error) {
      throw error;
    }
  }

  static async createSequence(sequenceData) {
    try {
      const sequence = await prisma.sequence.create({
        data: sequenceData,
      });
      return sequence;
    } catch (error) {
      throw error;
    }
  }

  static async updateSequence(sequenceId, sequenceData) {
    try {
      const sequence = await prisma.sequence.update({
        where: { id: sequenceId },
        data: sequenceData,
      });
      return sequence;
    } catch (error) {
      throw error;
    }
  }

  static async deleteSequence(sequenceId) {
    try {
      const sequence = await prisma.sequence.delete({
        where: { id: sequenceId },
      });
      return sequence;
    } catch (error) {
      throw error;
    }
  }

  static async updateSequenceState(sequenceId, state) {
    try {
      const sequence = await prisma.sequence.update({
        where: { id: sequenceId },
        data: { state },
      });
      return sequence;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Sequence;
