const prisma = require('../prismaClient');

class VoiceAgentCall {
  static async create(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript, bento, ipAddress) {
    // Check GDPR compliance
    if (!isGDPRCompliant({ prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript, bento, ipAddress })) {
      throw new Error('Data not compliant with GDPR');
    }

    // Detect resistance or regulatory edge cases
    const hasResistanceOrRegulatoryFlag = await VoiceAgentCall.detectResistanceOrRegulatoryEdgeCases({ callTranscript });

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

  static async detectResistanceOrRegulatoryEdgeCases(call) {
    // Example detection logic
    // This is a placeholder for actual detection logic
    const resistanceKeywords = ['busy', 'unavailable', 'regulatory', 'edge'];
    const callTranscriptLower = call.callTranscript.toLowerCase();

    for (const keyword of resistanceKeywords) {
      if (callTranscriptLower.includes(keyword)) {
        return true;
      }
    }
    return false;
  }
}

function isGDPRCompliant(data) {
  // Example GDPR compliance check
  // Ensure that the data contains a valid email and does not contain sensitive data
  return data.email && !data.sensitiveData;
}

module.exports = VoiceAgentCall;
