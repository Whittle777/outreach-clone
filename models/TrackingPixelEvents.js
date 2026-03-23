const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
  TrackingPixelEvents: {
    async create(data) {
      return await prisma.trackingPixelEvents.create({ data });
    },
    async findMany() {
      return await prisma.trackingPixelEvents.findMany();
    },
    async findUnique(where) {
      return await prisma.trackingPixelEvents.findUnique({ where });
    },
  },
};
