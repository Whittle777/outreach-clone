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
const TimeBlockConfig = require('../models/TimeBlockConfig'); // Add this line
const CallRate = require('../models/CallRate'); // Add this line
const BounceEvent = require('../models/bounceEvent'); // Added for bounce event tracking
const UnsubscribeEvent = require('../models/unsubscribeEvent'); // Added for unsubscribe event tracking
const Transcript = require('../models/Transcript'); // Added for transcript tracking
const SentimentAnalysis = require('../models/SentimentAnalysis'); // Added for sentiment analysis tracking

class DoubleWriteStrategy {
  constructor() {
    this.legacyDatastore = null;
    this.newDatastore = null;
    this.backupPath = config.getConfig().rollbackPlan.backupPath;
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
    }
  }

  async initiateAzureAcsCall(prospectData) {
    try {
      await this.azureAcsCallAutomation.initiateCall(prospectData);
      logger.log('Azure ACS call initiation successful', prospectData);
    } catch (error) {
      logger.error('Error initiating Azure ACS call', error);
    }
  }

  async initiateAzureAcsVoicemailDrop(prospectData, audioFileUrl) {
    try {
      await this.azureAcsCallAutomation.initiateVoicemailDrop(prospectData, audioFileUrl);
      logger.log('Azure ACS voicemail drop initiation successful', { prospectData, audioFileUrl });
    } catch (error) {
      logger.error('Error initiating Azure ACS voicemail drop', error);
    }
  }

  async isTimeWithinApprovedBlocks() {
    const timeBlockConfigs = await TimeBlockConfig.getAll();
    const now = new Date();

    for (const config of timeBlockConfigs) {
      const startTime = new Date(config.startTime);
      const endTime = new Date(config.endTime);
      const dayOfWeek = now.getDay();

      if (dayOfWeek >= config.startDayOfWeek && dayOfWeek <= config.endDayOfWeek &&
          now >= startTime && now <= endTime) {
        return true;
      }
    }

    return false;
  }

  async createCallRate(callRateData) {
    try {
      const callRate = await CallRate.create(callRateData);
      logger.log('Call rate created successfully', callRate);
      return callRate;
    } catch (error) {
      logger.error('Error creating call rate', error);
      throw error;
    }
  }

  async getCallRateById(id) {
    try {
      const callRate = await CallRate.findById(id);
      logger.log('Call rate retrieved successfully', callRate);
      return callRate;
    } catch (error) {
      logger.error('Error retrieving call rate', error);
    }
  }

  async updateCallRate(id, callRateData) {
    try {
      const callRate = await CallRate.update(id, callRateData);
      logger.log('Call rate updated successfully', callRate);
      return callRate;
    } catch (error) {
      logger.error('Error updating call rate', error);
    }
  }

  async deleteCallRate(id) {
    try {
      const callRate = await CallRate.delete(id);
      logger.log('Call rate deleted successfully', callRate);
      return callRate;
    } catch (error) {
      logger.error('Error deleting call rate', error);
    }
  }

  async getAllCallRates() {
    try {
      const callRates = await CallRate.getAll();
      logger.log('All call rates retrieved successfully', callRates);
      return callRates;
    } catch (error) {
      logger.error('Error retrieving all call rates', error);
    }
  }

  async createBounceEvent(bounceData) {
    try {
      const bounceEvent = await BounceEvent.create(bounceData);
      logger.log('Bounce event created successfully', bounceEvent);
      return bounceEvent;
    } catch (error) {
      logger.error('Error creating bounce event', error);
    }
  }

  async createUnsubscribeEvent(unsubscribeData) {
    try {
      const unsubscribeEvent = await UnsubscribeEvent.create(unsubscribeData);
      logger.log('Unsubscribe event created successfully', unsubscribeEvent);
      return unsubscribeEvent;
    } catch (error) {
      logger.error('Error creating unsubscribe event', error);
    }
  }

  async createTranscript(transcriptData) {
    try {
      const transcript = await Transcript.create(transcriptData);
      logger.log('Transcript created successfully', transcript);
      return transcript;
    } catch (error) {
      logger.error('Error creating transcript', error);
    }
  }

  async createSentimentAnalysis(sentimentData) {
    try {
      const sentimentAnalysis = await SentimentAnalysis.create(sentimentData);
      logger.log('Sentiment analysis created successfully', sentimentAnalysis);
      return sentimentAnalysis;
    } catch (error) {
      logger.error('Error creating sentiment analysis', error);
    }
  }

  async getPersonalizationWaterfall() {
    return this.config.personalizationWaterfall.sources;
  }
}

module.exports = new DoubleWriteStrategy();
