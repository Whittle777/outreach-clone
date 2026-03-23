const prisma = require('../services/database');

module.exports = {
  CallFlag: require('./CallFlag')(prisma),
  SentimentAnalysis: require('./SentimentAnalysis')(prisma),
  VoiceAgentCall: require('./VoiceAgentCall')(prisma),
  BounceEvent: require('./BounceEvent')(prisma),
  Deal: require('./Deal')(prisma),
  QuarterlyPerformance: require('./QuarterlyPerformance')(prisma),
  TimeBlockConfig: require('./TimeBlockConfig')(prisma),
};
