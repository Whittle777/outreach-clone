const { PrismaClient } = require('@prisma/client');
const config = require('../config/index').getConfig();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: config.prisma.url,
    },
  },
});

module.exports = prisma;
