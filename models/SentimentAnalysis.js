const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
  SentimentAnalysis: {
    async create(data) {
      return await prisma.sentimentAnalysis.create({ data });
    },
    async findMany() {
      return await prisma.sentimentAnalysis.findMany();
    },
    async findUnique(where) {
      return await prisma.sentimentAnalysis.findUnique({ where });
    },
  },
};
