// models/VoiceAgentCall.js

const prisma = require('../prismaClient');

class VoiceAgentCall {
  static async create(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript, bento, ipAddress) {
    // Check GDPR compliance
    if (!isGDPRCompliant({ prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript, bento, ipAddress })) {
      throw new Error('Data not compliant with GDPR');
    }

    // Detect resistance or regulatory edge cases
    const hasResistanceOrRegulatoryFlag = await VoiceAgentCall.detectResistanceOrRegulatoryEdgeCase(prospectId, callStatus, callTranscript);

    // Personalization Waterfall
    // ...

    return await prisma.voiceAgentCall.create({
      data: {
        prospectId,
        callStatus,
        preGeneratedScript,
        ttsAudioFileUrl,
        callTranscript,
        bento,
        ipAddress,
        hasResistanceOrRegulatoryFlag,
      },
    });
  }

  static async getAll() {
    return await prisma.voiceAgentCall.findMany();
  }

  static async detectResistanceOrRegulatoryEdgeCase(prospectId, callStatus, callTranscript) {
    // Implement logic to detect resistance or regulatory edge cases
    // For now, let's assume it always returns false
    return false;
  }
}

module.exports = VoiceAgentCall;
