const logger = require('./logger');
const fs = require('fs');
const path = require('path');
const AudioStorage = require('../services/audioStorage');
const { ServiceBusClient } = require('@azure/service-bus');
const AWS = require('aws-sdk');

class DoubleWriteStrategy {
  constructor() {
    this.legacyDatastore = null;
    this.newDatastore = null;
    this.backupPath = path.join(__dirname, 'backup.json');
    this.audioStorage = new AudioStorage();
    this.serviceBusConnectionString = process.env.SERVICE_BUS_CONNECTION_STRING || 'your-service-bus-connection-string';
    this.serviceBusQueueName = process.env.SERVICE_BUS_QUEUE_NAME || 'your-service-bus-queue-name';
    this.serviceBusClient = new ServiceBusClient(this.serviceBusConnectionString);
    this.serviceBusSender = this.serviceBusClient.createSender(this.serviceBusQueueName);

    // AWS SQS configuration
    this.sqs = new AWS.SQS({
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });
    this.sqsQueueUrl = process.env.SQS_QUEUE_URL || 'your-sqs-queue-url';
  }

  setLegacyDatastore(datastore) {
    this.legacyDatastore = datastore;
  }

  setNewDatastore(datastore) {
    this.newDatastore = datastore;
  }

  async write(data) {
    try {
      await this.legacyDatastore.write(data);
      logger.log('Legacy datastore write successful', data);
      await this.newDatastore.write(data);
      logger.log('New datastore write successful', data);
      await this.sendToServiceBus(data);
      await this.sendToSQS(data);
      logger.log('Double-write successful');
    } catch (error) {
      logger.error('Double-write failed:', error);
      throw error;
    }
  }

  async backup() {
    try {
      const data = await this.legacyDatastore.readAll();
      fs.writeFileSync(this.backupPath, JSON.stringify(data, null, 2));
      logger.log('Backup successful');
    } catch (error) {
      logger.error('Backup failed:', error);
      throw error;
    }
  }

  async rollback() {
    try {
      if (fs.existsSync(this.backupPath)) {
        const backupData = JSON.parse(fs.readFileSync(this.backupPath, 'utf8'));
        await this.legacyDatastore.writeAll(backupData);
        logger.log('Rollback successful');
      } else {
        logger.error('No backup found');
      }
    } catch (error) {
      logger.error('Rollback failed:', error);
      throw error;
    }
  }

  async simulateMigration() {
    try {
      await this.backup();
      await this.newDatastore.migrateFrom(this.legacyDatastore);
      logger.log('Migration successful');
    } catch (error) {
      logger.error('Migration failed:', error);
      await this.rollback();
      throw error;
    }
  }

  async checkConsistency() {
    try {
      const legacyData = await this.legacyDatastore.readAll();
      const newData = await this.newDatastore.readAll();

      const isConsistent = JSON.stringify(legacyData) === JSON.stringify(newData);

      if (isConsistent) {
        logger.log('Data consistency check passed');
      } else {
        logger.error('Data consistency check failed');
      }

      return isConsistent;
    } catch (error) {
      logger.error('Consistency check failed:', error);
      throw error;
    }
  }

  async storeAudioFile(fileData) {
    try {
      await this.audioStorage.store(fileData);
      logger.log('Audio file stored successfully', fileData);
    } catch (error) {
      logger.error('Failed to store audio file', error);
      throw error;
    }
  }

  async sendToServiceBus(data) {
    try {
      const message = { body: JSON.stringify(data) };
      await this.serviceBusSender.sendMessages(message);
      logger.log('Message sent to Service Bus', message);
    } catch (error) {
      logger.error('Failed to send message to Service Bus', error);
      throw error;
    }
  }

  async sendToSQS(data) {
    try {
      const params = {
        MessageBody: JSON.stringify(data),
        QueueUrl: this.sqsQueueUrl,
      };
      await this.sqs.sendMessage(params).promise();
      logger.log('Message sent to SQS', params);
    } catch (error) {
      logger.error('Failed to send message to SQS', error);
      throw error;
    }
  }
}

module.exports = new DoubleWriteStrategy();
