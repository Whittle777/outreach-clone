// models/VoiceAgentCall.js

const prisma = require('../prismaClient');

class VoiceAgentCall {
  static async create(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript, bento, ipAddress, teamsResourceAccountObjectId) {
    // Check GDPR compliance
    if (!isGDPRCompliant({ prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript, bento, ipAddress, teamsResourceAccountObjectId })) {
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
        teamsResourceAccountObjectId,
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

  static async updateCallStatus(id, newStatus) {
    if (!['Queued', 'Dialing', 'Connected', 'Voicemail Dropped', 'Human Answered', 'Failed'].includes(newStatus)) {
      throw new Error('Invalid call status');
    }

    return await prisma.voiceAgentCall.update({
      where: { id },
      data: { callStatus: newStatus },
    });
  }
}

module.exports = VoiceAgentCall;
