const prisma = require('../prismaClient');

class VoiceAgentCall {
  static async create(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript, sentimentScore, sentimentLabel, bento, logMessage, country) {
    // Check GDPR compliance
    if (!isGDPRCompliant({ prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript, sentimentScore, sentimentLabel, bento, logMessage, country })) {
      throw new Error('Data not compliant with GDPR');
    }

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
    // Check GDPR compliance
    if (!isGDPRCompliant(updateData)) {
      throw new Error('Data not compliant with GDPR');
    }

    return await prisma.voiceAgentCall.update({
      where: { id },
      data: updateData,
    });
  }

  static async getAll() {
    return await prisma.voiceAgentCall.findMany();
  }
}

function isGDPRCompliant(data) {
  // Example GDPR compliance check
  // Ensure that the data does not contain sensitive data
  return !data.sensitiveData;
}

module.exports = VoiceAgentCall;
