const { ServiceBusClient } = require('@azure/service-bus');
const config = require('../config');

const serviceBusClient = new ServiceBusClient(config.azureServiceBus.connectionString);
const sender = serviceBusClient.createSender(config.azureServiceBus.topicName);

async function sendMessage(topic, message) {
  await sender.sendMessages({ body: message });
}

async function close() {
  await sender.close();
  await serviceBusClient.close();
}

module.exports = {
  sendMessage,
  close,
};
