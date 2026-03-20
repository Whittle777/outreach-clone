const prisma = require('../services/database');

class DealHealthScore {
  static async create(dealHealthScoreData) {
    return await prisma.dealHealthScore.create({
      data: dealHealthScoreData,
    });
  }

  static async findById(id) {
    return await prisma.dealHealthScore.findUnique({
      where: { id: parseInt(id) },
    });
  }

  static async update(id, dealHealthScoreData) {
    return await prisma.dealHealthScore.update({
      where: { id: parseInt(id) },
      data: dealHealthScoreData,
    });
  }

  static async delete(id) {
    return await prisma.dealHealthScore.delete({
      where: { id: parseInt(id) },
    });
  }

  static async getAll() {
    return await prisma.dealHealthScore.findMany();
  }
}

module.exports = DealHealthScore;
