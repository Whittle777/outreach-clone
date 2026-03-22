const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
  Deal: {
    async create(data) {
      return await prisma.deal.create({ data });
    },
    async findMany() {
      return await prisma.deal.findMany();
    },
    async findUnique(where) {
      return await prisma.deal.findUnique({ where });
    },
    async update(where, data) {
      return await prisma.deal.update({ where, data });
    },
    async delete(where) {
      return await prisma.deal.delete({ where });
    },
  },
};
