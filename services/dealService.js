const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class DealService {
  static async create(dealData) {
    return await prisma.deal.create({
      data: dealData,
    });
  }

  static async findById(id) {
    return await prisma.deal.findUnique({
      where: { id: parseInt(id) },
    });
  }

  static async update(id, dealData) {
    return await prisma.deal.update({
      where: { id: parseInt(id) },
      data: dealData,
    });
  }

  static async delete(id) {
    return await prisma.deal.delete({
      where: { id: parseInt(id) },
    });
  }

  static async getAll() {
    return await prisma.deal.findMany();
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
}

module.exports = DealService;
