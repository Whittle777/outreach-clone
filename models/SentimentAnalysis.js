const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class SentimentAnalysis {
  static async create(prospectId, sentimentScore, sentimentLabel, metadata) {
    return await prisma.sentimentAnalysis.create({
      data: {
        prospectId,
        sentimentScore,
        sentimentLabel,
        metadata: JSON.stringify(metadata),
      },
    });
  }

  static async findByProspectId(prospectId) {
    return await prisma.sentimentAnalysis.findMany({
      where: {
        prospectId,
      },
    });
  }
}

module.exports = SentimentAnalysis;
