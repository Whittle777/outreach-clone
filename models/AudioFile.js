const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AudioFile {
  static async create(file, metadata) {
    return await prisma.audioFile.create({
      data: {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        metadata: JSON.stringify(metadata),
        fileUrl: '', // This will be updated after upload
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
}

module.exports = AudioFile;
