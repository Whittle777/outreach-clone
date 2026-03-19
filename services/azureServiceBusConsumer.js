const { ServiceBusClient } = require('@azure/service-bus');

class AzureServiceBusConsumer {
  constructor(connectionString, queueName) {
    this.serviceBusClient = new ServiceBusClient(connectionString);
    this.queueName = queueName;
    this.receiver = null;
  }

  async start() {
    this.receiver = this.serviceBusClient.createReceiver(this.queueName);
    this.receiver.subscribe({
      processMessage: async (brokeredMessage) => {
        console.log('Received message:', brokeredMessage.body);
        // Add your message processing logic here
        await brokeredMessage.complete();
      },
      processError: async (err) => {
        console.error('Error occurred while processing message:', err);
      },
    });
  }

  async stop() {
    if (this.receiver) {
      await this.receiver.close();
    }
    await this.serviceBusClient.close();
  }
}

module.exports = AzureServiceBusConsumer;
