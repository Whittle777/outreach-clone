const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class VoiceAgentCall {
  static async create(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript, sentimentScore, sentimentLabel, bento) {
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
      },
    });
  }

  static async getAll() {
    return await prisma.voiceAgentCall.findMany();
  }
}

module.exports = VoiceAgentCall;
