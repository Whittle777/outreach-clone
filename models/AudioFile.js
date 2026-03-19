const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AudioFile {
  static async create(file, metadata, country) {
    // Check GDPR compliance
    if (!isGDPRCompliant(metadata)) {
      throw new Error('Data not compliant with GDPR');
    }

    return await prisma.audioFile.create({
      data: {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        metadata: JSON.stringify(metadata),
        fileUrl: '', // This will be updated after upload
        country,
      },
    });
  }

  static async findById(id) {
    return await prisma.audioFile.findUnique({
      where: { id },
    });
  }

  static async updateFileUrl(id, fileUrl) {
    return await prisma.audioFile.update({
      where: { id },
      data: {
        fileUrl,
      },
    });
  }

  static async getAudioFilesByProspectId(prospectId) {
    return await prisma.audioFile.findMany({
      where: {
        metadata: {
          prospectId,
        },
      },
    });
  }
}

function isGDPRCompliant(metadata) {
  // Example GDPR compliance check
  // Ensure that the metadata does not contain sensitive data
  return !metadata.sensitiveData;
}

module.exports = AudioFile;
