const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
  QuarterlyPerformance: {
    async create(data) {
      return await prisma.quarterlyPerformance.create({ data });
    },
    async findMany() {
      return await prisma.quarterlyPerformance.findMany();
    },
    async findUnique(where) {
      return await prisma.quarterlyPerformance.findUnique({ where });
    },
    async update(where, data) {
      return await prisma.quarterlyPerformance.update({ where, data });
    },
    async delete(where) {
      return await prisma.quarterlyPerformance.delete({ where });
    }
  }
};
