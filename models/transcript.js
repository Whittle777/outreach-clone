const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class Transcript {
  static async create(transcriptionId, transcriptText, metadata, country) {
    // Check GDPR compliance
    if (!isGDPRCompliant(metadata)) {
      throw new Error('Data not compliant with GDPR');
    }

    return await prisma.transcript.create({
      data: {
        transcriptionId,
        transcriptText,
        metadata: JSON.stringify(metadata),
        country,
      },
    });
  }

  static async findByTranscriptionId(transcriptionId) {
    return await prisma.transcript.findUnique({
      where: {
        transcriptionId,
      },
    });
  }
}

function isGDPRCompliant(metadata) {
  // Example GDPR compliance check
  // Ensure that the metadata does not contain sensitive data
  return !metadata.sensitiveData;
}

module.exports = Transcript;
