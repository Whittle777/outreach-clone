const MessageBroker = require('../messageBroker');
const config = require('../config'); // Assuming there is a config file with the message broker configuration
const messageBroker = new MessageBroker(config);

async function createVoiceAgentCall(message) {
  try {
    await messageBroker.sendMessage(message);
    console.log('Voice agent call created successfully');
  } catch (error) {
    console.error('Error creating voice agent call:', error.message);
  }
}

module.exports = {
  createVoiceAgentCall,
};
