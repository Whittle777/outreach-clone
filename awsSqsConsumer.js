const AWS = require('aws-sdk');
const sqs = new AWS.SQS({ region: 'us-east-1' });
const queueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789012/your-queue-name';
const wss = require('./websocketServer');
const KnowledgeGraph = require('../services/knowledgeGraph');
const config = require('../config/settings');
const RabbitMQ = require('../messageBroker/rabbitMQ');
const rabbitMQ = new RabbitMQ(config.rabbitMQ);
const doubleWriteStrategy = require('../services/doubleWriteStrategy');
const Scheduler = require('../services/scheduler');
const scheduler = new Scheduler();
const TtsService = require('../services/ttsService');
const ttsService = new TtsService(config.elevenLabs.apiKey);
const VoiceAgentCall = require('../models/VoiceAgentCall');
const path = require('path');

async function consumeMessages() {
  const params = {
    QueueUrl: queueUrl,
    WaitTimeSeconds: 20,
  };

  try {
    const data = await sqs.receiveMessage(params).promise();
    if (data.Messages) {
      data.Messages.forEach(async (message) => {
        // Process the message and send updates to the WebSocket server
        const messageBody = JSON.parse(message.Body);
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(messageBody));
          }
        });

        // Create knowledge graph nodes
        await knowledgeGraph.createNode('Prospect', messageBody);

        // Send message to Microsoft Teams
        await rabbitMQ.sendMessageToMicrosoftTeams(`New message from SQS: ${JSON.stringify(messageBody)}`);

        // Double-write strategy
        await doubleWriteStrategy.write(messageBody);

        // Check for migration message
        if (messageBody.type === 'migration' && messageBody.action === 'schedule') {
          scheduler.scheduleMigration(messageBody.maintenanceWindow);
        }

        // Generate TTS audio file
        if (messageBody.preGeneratedScript) {
          const ttsAudioFilePath = path.join(__dirname, `tts_audio_${messageBody.prospectId}.wav`);
          const ttsAudioFileUrl = await ttsService.generateAndStoreTtsAudio(messageBody.preGeneratedScript, config.elevenLabs.voiceId, ttsAudioFilePath);
          messageBody.ttsAudioFileUrl = ttsAudioFileUrl;

          // Create VoiceAgentCall record
          await VoiceAgentCall.create(
            messageBody.prospectId,
            'Queued',
            messageBody.preGeneratedScript,
            ttsAudioFileUrl,
            ''
          );
        }

        // Delete the message from the queue
        const deleteParams = {
          QueueUrl: queueUrl,
          ReceiptHandle: message.ReceiptHandle,
        };
        await sqs.deleteMessage(deleteParams).promise();
      });
    }
  } catch (error) {
    console.error('Error consuming messages:', error);
  }
}

module.exports = consumeMessages;
