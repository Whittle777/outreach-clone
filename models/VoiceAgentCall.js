const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class VoiceAgentCall {
  static async create(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript, sentimentScore, sentimentLabel, bento, logMessage) {
    return await prisma.voiceAgentCall.create({
      data: {
        prospectId,
        callStatus,
        preGeneratedScript,
        ttsAudioFileUrl,
        callTranscript,
        sentimentScore,
        sentimentLabel,
        bento,
        logMessage,
      },
    });
  }

  static async getAll() {
    return await prisma.voiceAgentCall.findMany();
  }

  static async update(id, updateData) {
    return await prisma.voiceAgentCall.update({
      where: { id },
      data: updateData,
    });
  }
}

module.exports = VoiceAgentCall;
