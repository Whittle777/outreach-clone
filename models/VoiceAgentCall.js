const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
  VoiceAgentCall: {
    async create(data) {
      return await prisma.voiceAgentCall.create({ data });
    },
    async findMany() {
      return await prisma.voiceAgentCall.findMany();
    },
    async findUnique(where) {
      return await prisma.voiceAgentCall.findUnique({ where });
    },
    async update(where, data) {
      return await prisma.voiceAgentCall.update({ where, data });
    },
    async delete(where) {
      return await prisma.voiceAgentCall.delete({ where });
    },
  },
};
