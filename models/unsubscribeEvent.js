const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class UnsubscribeEvent {
  static async create(unsubscribeData) {
    return await prisma.unsubscribeEvent.create({
      data: unsubscribeData,
    });
  }

  static async getAll() {
    return await prisma.unsubscribeEvent.findMany();
  }
}

module.exports = UnsubscribeEvent;
