const { ServiceBusClient } = require('@azure/service-bus');

class AzureServiceBus {
  constructor(config) {
    this.serviceBusClient = new ServiceBusClient(config.connectionString);
    this.sender = this.serviceBusClient.createSender(config.topicName);
    this.receiver = this.serviceBusClient.createReceiver(config.subscriptionName);
  }

  async sendMessage(message) {
    await this.sender.sendMessages({ body: message });
  }

  async receiveMessage() {
    const receivedMessages = await this.receiver.receiveMessages(1);
    if (receivedMessages.length > 0) {
      const message = receivedMessages[0];
      await message.complete();
      return message.body;
    }
    return null;
  }

  async close() {
    await this.sender.close();
    await this.receiver.close();
    await this.serviceBusClient.close();
  }
}

module.exports = AzureServiceBus;
