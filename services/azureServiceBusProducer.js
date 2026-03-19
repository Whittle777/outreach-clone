const { ServiceBusClient } = require('@azure/service-bus');

const connectionString = process.env.AZURE_SERVICE_BUS_CONNECTION_STRING;
const topicName = process.env.AZURE_SERVICE_BUS_TOPIC_NAME;

const serviceBusClient = new ServiceBusClient(connectionString);
const sender = serviceBusClient.createSender(topicName);

async function sendMessage(message) {
  await sender.sendMessages(message);
}

async function close() {
  await sender.close();
  await serviceBusClient.close();
}

module.exports = {
  sendMessage,
  close,
};
