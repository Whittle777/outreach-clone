const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class Transcript {
  static async create(transcriptData) {
    return await prisma.transcript.create({
      data: transcriptData,
    });
  }
}

module.exports = Transcript;
