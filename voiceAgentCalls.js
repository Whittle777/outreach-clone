const MessageBroker = require('../messageBroker');
const config = require('../config'); // Assuming there is a config file with the message broker configuration
const messageBroker = new MessageBroker(config);
const SentimentAnalysis = require('../services/sentimentAnalysis');
const sentimentAnalysis = new SentimentAnalysis(config.sentimentAnalysisApiKey);

async function createVoiceAgentCall(message) {
  try {
    const key = `voiceAgentCall:${message.phoneNumber}`; // Unique key for rate limiting based on phone number
    const limit = 10; // Example limit: 10 calls per duration
    const duration = 60; // Example duration: 60 seconds

    if (await messageBroker.isRateLimited(key, limit)) {
      console.error('Rate limit exceeded for phone number:', message.phoneNumber);
      return;
    }

    await messageBroker.incrementRequestCount(key);

    // Analyze sentiment of the text transcript
    const sentimentResult = await sentimentAnalysis.analyze(message.transcript);
    message.sentiment = sentimentResult;

    await messageBroker.sendMessage(message);
    console.log('Voice agent call created successfully with sentiment analysis');
  } catch (error) {
    console.error('Error creating voice agent call:', error.message);
  }
}

module.exports = {
  createVoiceAgentCall,
};
