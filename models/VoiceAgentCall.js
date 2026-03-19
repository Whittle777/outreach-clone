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
}

module.exports = VoiceAgentCall;
