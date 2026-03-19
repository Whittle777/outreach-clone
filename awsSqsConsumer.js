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

const knowledgeGraph = new KnowledgeGraph(config.neo4j.uri, config.neo4j.user, config.neo4j.password);

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
