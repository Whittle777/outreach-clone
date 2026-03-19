const prisma = require('../prismaClient');
const AudioFile = require('./AudioFile');
const SentimentAnalysis = require('./SentimentAnalysis');
const logger = require('../services/logger');

class VoiceAgentCall {
  static async create(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript, bento, ipAddress, callGoal, talkTrack) {
    // Check GDPR compliance
    if (!isGDPRCompliant({ prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript, bento, ipAddress, callGoal, talkTrack })) {
      throw new Error('Data not compliant with GDPR');
    }

    // Detect resistance or regulatory edge cases
    const hasResistanceOrRegulatoryFlag = await VoiceAgentCall.detectResistanceOrRegulatoryEdgeCases({ callTranscript });

    // Personalization Waterfall
    const audioFiles = await AudioFile.getAudioFilesByProspectId(prospectId);
    const sentimentAnalyses = await SentimentAnalysis.findByProspectId(prospectId);

    const personalizedScript = VoiceAgentCall.generatePersonalizedScript(preGeneratedScript, audioFiles, sentimentAnalyses);
    logger.log(`Personalized script generated for prospect ${prospectId}: ${personalizedScript}`);

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
        personalizedScript,
        callGoal,
        talkTrack,
      },
    });
  }

  static async getAll() {
    return await prisma.voiceAgentCall.findMany();
  }

  static async getFilterChips() {
    const voiceAgentCalls = await prisma.voiceAgentCall.findMany();
    const filterChips = {};

    voiceAgentCalls.forEach((call) => {
      if (!filterChips[call.callStatus]) {
        filterChips[call.callStatus] = 0;
      }
      filterChips[call.callStatus]++;
    });

    return filterChips;
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

  static generatePersonalizedScript(preGeneratedScript, audioFiles, sentimentAnalyses) {
    // Example personalization logic
    // This is a placeholder for actual personalization logic
    let personalizedScript = preGeneratedScript;

    // Add audio file information to the script
    audioFiles.forEach((audioFile) => {
      personalizedScript += `\nAudio File: ${audioFile.fileName}, Type: ${audioFile.fileType}, Size: ${audioFile.fileSize}`;
    });

    // Add sentiment analysis information to the script
    sentimentAnalyses.forEach((sentimentAnalysis) => {
      personalizedScript += `\nSentiment Analysis: ${sentimentAnalysis.sentimentLabel}, Score: ${sentimentAnalysis.sentimentScore}`;
    });

    return personalizedScript;
  }
}

function isGDPRCompliant(data) {
  // Example GDPR compliance check
  // Ensure that the data contains a valid email and does not contain sensitive data
  return data.email && !data.sensitiveData;
}

module.exports = VoiceAgentCall;
