const prisma = require('../services/database');
const VoiceAgentIntegration = require('../services/voiceAgentIntegration');
const KnowledgeGraph = require('../services/knowledgeGraph');
const logger = require('../services/logger');

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

    const voiceAgentIntegration = new VoiceAgentIntegration('your-api-key', 'your-api-url');

    if (callStatus === 'Failed') {
      await voiceAgentIntegration.handleFailedState(prospectId, callId);
    }

    const voiceAgentCall = await prisma.voiceAgentCall.create({
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

    // Track voice agent interaction in KnowledgeGraph
    const knowledgeGraph = new KnowledgeGraph();
    await knowledgeGraph.write({
      type: 'voiceAgentCall',
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

    // Log voice agent interaction
    logger.aiDecision('Voice agent call created', {
      prospectId,
      callStatus,
      preGeneratedScript,
      ttsAudioFileUrl,
      callTranscript,
      bento,
      ipAddress,
      teamsResourceAccountObjectId,
      hasResistanceOrRegulatoryFlag,
    });

    return voiceAgentCall;
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

    const updatedCall = await prisma.voiceAgentCall.update({
      where: { id },
      data: { callStatus: newStatus },
    });

    // Track updated voice agent interaction in KnowledgeGraph
    const knowledgeGraph = new KnowledgeGraph();
    await knowledgeGraph.write({
      type: 'voiceAgentCallUpdate',
      data: {
        id,
        newStatus,
      },
    });

    // Log updated voice agent interaction
    logger.aiDecision('Voice agent call status updated', {
      id,
      newStatus,
    });

    return updatedCall;
  }
}

module.exports = VoiceAgentCall;
