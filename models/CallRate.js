const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class CallRate {
  static async create(callRateData) {
    return await prisma.callRate.create({
      data: callRateData,
    });
  }

  static async findById(id) {
    return await prisma.callRate.findUnique({
      where: { id: parseInt(id) },
    });
  }

  static async update(id, callRateData) {
    return await prisma.callRate.update({
      where: { id: parseInt(id) },
      data: callRateData,
    });
  }

  static async delete(id) {
    return await prisma.callRate.delete({
      where: { id: parseInt(id) },
    });
  }

  static async getAll() {
    return await prisma.callRate.findMany();
  }
}

module.exports = CallRate;
