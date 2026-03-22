const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
  BounceEvent: {
    async create(data) {
      return await prisma.bounceEvent.create({ data });
    },
    async findMany() {
      return await prisma.bounceEvent.findMany();
    },
    async findUnique(where) {
      return await prisma.bounceEvent.findUnique({ where });
    },
  },
};
