const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class SentimentAnalysis {
  static async create(prospectId, sentimentScore, sentimentLabel, metadata, country) {
    // Check GDPR compliance
    if (!isGDPRCompliant(metadata)) {
      throw new Error('Data not compliant with GDPR');
    }

    return await prisma.sentimentAnalysis.create({
      data: {
        prospectId,
        sentimentScore,
        sentimentLabel,
        metadata: JSON.stringify(metadata),
        country,
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

function isGDPRCompliant(metadata) {
  // Example GDPR compliance check
  // Ensure that the metadata does not contain sensitive data
  return !metadata.sensitiveData;
}

module.exports = SentimentAnalysis;
