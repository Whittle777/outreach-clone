const { ServiceBusClient } = require('@azure/service-bus');
const { voiceCallLimiter } = require('../services/rateLimiter');

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

  // Method to send message with Microsoft Entra Object ID
  async sendMessageWithEntraObjectId(message, entraObjectId) {
    const messageWithEntraObjectId = {
      ...message,
      entraObjectId
    };
    await this.sender.sendMessages({ body: messageWithEntraObjectId });
  }

  async sendMessageWithRateLimit(message, prospectId, phoneNumber) {
    const key = `voiceCall:${prospectId}:${phoneNumber}`;
    if (await voiceCallLimiter.isRateLimited(key)) {
      console.log(`Rate limit exceeded for prospectId: ${prospectId} with phone number: ${phoneNumber}`);
      return;
    }

    await voiceCallLimiter.incrementRequestCount(key);
    await this.sendMessage(message);
  }
}

module.exports = AzureServiceBus;
