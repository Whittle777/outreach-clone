const logger = require('./logger');
const fs = require('fs');
const path = require('path');
const AudioStorage = require('../services/audioStorage');
const { ServiceBusClient } = require('@azure/service-bus');
const AWS = require('aws-sdk');
const amqplib = require('amqplib');
const config = require('./config');
const prisma = require('../services/database');
const AzureAcsCallAutomation = require('../services/azureAcsCallAutomation');

class DoubleWriteStrategy {
  constructor() {
    this.legacyDatastore = null;
    this.newDatastore = null;
    this.backupPath = path.join(__dirname, 'backup.json');
    this.audioStorage = new AudioStorage();
    this.config = config.getConfig();
    this.azureAcsCallAutomation = new AzureAcsCallAutomation();

    // Initialize message queue based on configuration
    this.initializeMessageQueue();
  }

  setLegacyDatastore(datastore) {
    this.legacyDatastore = datastore;
  }

  setNewDatastore(datastore) {
    this.newDatastore = datastore;
  }

  initializeMessageQueue() {
    switch (this.config.messageQueueType) {
      case 'serviceBus':
        this.serviceBusClient = new ServiceBusClient(this.config.serviceBusConnectionString);
        this.serviceBusSender = this.serviceBusClient.createSender(this.config.serviceBusQueueName);
        break;
      case 'sqs':
        this.sqs = new AWS.SQS({
          region: process.env.AWS_REGION || 'us-east-1',
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        });
        this.sqsQueueUrl = this.config.sqsQueueUrl;
        break;
      case 'rabbitmq':
        this.rabbitmqUrl = this.config.rabbitmqUrl;
        this.rabbitmqQueueName = this.config.rabbitmqQueueName;
        break;
      default:
        throw new Error('Invalid message queue type');
    }
  }

  async write(data) {
    try {
      await this.legacyDatastore.write(data);
      logger.log('Legacy datastore write successful', data);
      await this.newDatastore.write(data);
      logger.log('New datastore write successful', data);
      await this.sendMessage(data);
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

  async sendMessage(data) {
    try {
      switch (this.config.messageQueueType) {
        case 'serviceBus':
          const message = { body: JSON.stringify(data) };
          await this.serviceBusSender.sendMessages(message);
          logger.log('Message sent to Service Bus', message);
          break;
        case 'sqs':
          const params = {
            MessageBody: JSON.stringify(data),
            QueueUrl: this.sqsQueueUrl,
          };
          await this.sqs.sendMessage(params).promise();
          logger.log('Message sent to SQS', params);
          break;
        case 'rabbitmq':
          const connection = await amqplib.connect(this.rabbitmqUrl);
          const channel = await connection.createChannel();
          await channel.assertQueue(this.rabbitmqQueueName, { durable: true });
          channel.sendToQueue(this.rabbitmqQueueName, Buffer.from(JSON.stringify(data)));
          logger.log('Message sent to RabbitMQ', data);
          await channel.close();
          await connection.close();
          break;
        default:
          throw new Error('Invalid message queue type');
      }
    } catch (error) {
      logger.error('Failed to send message', error);
      throw error;
    }
  }

  async initiateAzureAcsCall(prospectData) {
    try {
      await this.azureAcsCallAutomation.initiateCall(prospectData);
      logger.log('Azure ACS call initiation successful', prospectData);
    } catch (error) {
      logger.error('Error initiating Azure ACS call', error);
      throw error;
    }
  }

  async initiateAzureAcsVoicemailDrop(prospectData, audioFileUrl) {
    try {
      await this.azureAcsCallAutomation.initiateVoicemailDrop(prospectData, audioFileUrl);
      logger.log('Azure ACS voicemail drop initiation successful', { prospectData, audioFileUrl });
    } catch (error) {
      logger.error('Error initiating Azure ACS voicemail drop', error);
      throw error;
    }
  }
}

module.exports = new DoubleWriteStrategy();
