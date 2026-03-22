const { prisma } = require('../prismaClient');

module.exports = {
  TimeBlockConfig: {
    async create(data) {
      return await prisma.timeBlockConfig.create({ data });
    },
    async findMany() {
      return await prisma.timeBlockConfig.findMany();
    },
    async findUnique(where) {
      return await prisma.timeBlockConfig.findUnique({ where });
    },
    async update(where, data) {
      return await prisma.timeBlockConfig.update({ where, data });
    },
    async delete(where) {
      return await prisma.timeBlockConfig.delete({ where });
    },
  },
};
