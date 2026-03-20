const { ServiceBusClient } = require('@azure/service-bus');

class AzureServiceBus {
  constructor(connectionString, queueName) {
    this.serviceBusClient = new ServiceBusClient(connectionString);
    this.queueName = queueName;
    this.sender = this.serviceBusClient.createSender(queueName);
  }

  async sendMessage(message) {
    try {
      await this.sender.sendMessages(message);
      console.log(`Message sent to Azure Service Bus queue: ${this.queueName}`);
    } catch (error) {
      console.error('Error sending message to Azure Service Bus:', error);
      throw error;
    }
  }

  async close() {
    await this.sender.close();
    await this.serviceBusClient.close();
  }
}

module.exports = AzureServiceBus;
