const prisma = require('../prismaClient');

class VoiceAgentCall {
  static async create(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript, sentimentScore, sentimentLabel, bento, logMessage, country) {
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
        country,
      },
    });
  }

  static async update(id, updateData) {
    return await prisma.voiceAgentCall.update({
      where: { id },
      data: updateData,
    });
  }

  static async getAll() {
    return await prisma.voiceAgentCall.findMany();
  }
}

module.exports = VoiceAgentCall;
