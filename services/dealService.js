const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const Deal = require('../models/deal');

class DealService {
  static async create(dealData) {
    return await Deal.create(dealData);
  }

  static async findById(id) {
    return await Deal.findUnique({ id: parseInt(id) });
  }

  static async update(id, dealData) {
    return await Deal.update({ id: parseInt(id) }, dealData);
  }

  static async delete(id) {
    return await Deal.delete({ id: parseInt(id) });
  }

  static async getAll() {
    return await Deal.findMany();
  }

  static async getHighValueDealsWithinRange(minValue, maxValue, startDate, endDate) {
    return await prisma.deal.findMany({
      where: {
        value: {
          gte: minValue,
          lte: maxValue,
        },
        closeDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
    });
  }

  static async getTopOpportunities(minValue, maxValue, startDate, endDate) {
    return await prisma.deal.findMany({
      where: {
        value: {
          gte: minValue,
          lte: maxValue,
        },
        closeDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: {
        value: 'desc',
      },
    });
  }

  static async triggerTTSConversion(text) {
    // Placeholder implementation for TTS conversion
    console.log('Triggering TTS conversion for:', text);
    // Actual implementation would involve calling a TTS service API
  }
}

module.exports = DealService;
