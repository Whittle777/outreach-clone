const AzureServiceBusConsumer = require('./azureServiceBusConsumer');

const connectionString = process.env.AZURE_SERVICE_BUS_CONNECTION_STRING;
const queueName = process.env.AZURE_SERVICE_BUS_QUEUE_NAME;

const azureServiceBusConsumer = new AzureServiceBusConsumer(connectionString, queueName);

module.exports = {
  azureServiceBusConsumer,
};
