const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class TimeBlockConfig {
  static async create(timeBlockConfig) {
    return await prisma.timeBlockConfig.create({
      data: timeBlockConfig,
    });
  }

  static async getAll() {
    return await prisma.timeBlockConfig.findMany();
  }

  static async delete(id) {
    return await prisma.timeBlockConfig.delete({
      where: { id },
    });
  }
}

module.exports = TimeBlockConfig;
