const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class VoiceAgentCall {
  static async create(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript, sentimentAnalysis, bento) {
    return await prisma.voiceAgentCall.create({
      data: {
        prospectId,
        callStatus,
        preGeneratedScript,
        ttsAudioFileUrl,
        callTranscript,
        sentimentAnalysis,
        bento,
      },
    });
  }
}

module.exports = VoiceAgentCall;
