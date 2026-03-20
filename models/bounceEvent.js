const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class BounceEvent {
  static async create(bounceData) {
    return await prisma.bounceEvent.create({
      data: bounceData,
    });
  }

  static async getAll() {
    return await prisma.bounceEvent.findMany();
  }
}

module.exports = BounceEvent;
