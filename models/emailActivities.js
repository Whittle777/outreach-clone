const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
  EmailActivities: {
    async create(data) {
      return await prisma.emailActivities.create({ data });
    },
    async findMany() {
      return await prisma.emailActivities.findMany();
    },
    async findUnique(where) {
      return await prisma.emailActivities.findUnique({ where });
    },
    async linkTrackingPixelEvent(emailId, trackingPixelEventId) {
      return await prisma.emailActivities.update({
        where: { id: emailId },
        data: { trackingPixelEventId },
      });
    },
  },
};
