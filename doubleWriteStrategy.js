const fs = require('fs');
const path = require('path');
const AudioStorage = require('./audioStorage');
const logger = require('./logger');
const config = require('./config');
const temporalStateManager = require('./temporalStateManager');
const DealHealthScore = require('../models/dealHealthScore');

class DoubleWriteStrategy {
  constructor() {
    this.legacyDatastore = null;
    this.newDatastore = null;
    this.backupPath = path.join(__dirname, 'backup.json');
    this.audioStorage = new AudioStorage();
    this.config = config.getConfig();
    this.azureAcsCallAutomation = new AzureAcsCallAutomation();
  }

  setLegacyDatastore(legacyDatastore) {
    this.legacyDatastore = legacyDatastore;
  }

  setNewDatastore(newDatastore) {
    this.newDatastore = newDatastore;
  }

  async write(data) {
    try {
      await this.legacyDatastore.write(data);
      logger.log('Legacy datastore write successful', data);
      await this.newDatastore.write(data);
      logger.log('New datastore write successful', data);
      if (data.type === 'deal-health-score') {
        logger.log('Deal health score calculation logged', data);
      }
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
        const data = JSON.parse(fs.readFileSync(this.backupPath, 'utf8'));
        await this.legacyDatastore.writeAll(data);
        logger.log('Rollback successful');
      } else {
        logger.error('Backup file does not exist');
        throw new Error('Backup file does not exist');
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
      logger.log('Rolled back after migration failure');
    }
  }

  async storeAudioFile(fileData) {
    try {
      await this.audioStorage.store(fileData);
      logger.log('Audio file stored successfully', fileData);
    } catch (error) {
      logger.error('Audio file storage failed:', error);
      throw error;
    }
  }

  async processSentimentAnalysis(prospectId, sentimentData) {
    try {
      await this.write({ type: 'sentiment-analysis', data: { prospectId, sentimentData } });
      logger.log('Sentiment analysis processed successfully', { prospectId, sentimentData });
    } catch (error) {
      logger.error('Sentiment analysis processing failed:', error);
      throw error;
    }
  }

  async createCallRate(callRateData) {
    try {
      await this.write({ type: 'call-rate', data: callRateData });
      logger.log('Call rate created successfully', callRateData);
    } catch (error) {
      logger.error('Call rate creation failed:', error);
      throw error;
    }
  }

  async getCallRateById(id) {
    try {
      const data = await this.newDatastore.readAll();
      const callRate = data.find(item => item.type === 'call-rate' && item.data.id === id);
      if (callRate) {
        logger.log('Call rate retrieved successfully', callRate);
        return callRate;
      } else {
        logger.error('Call rate not found', { id });
        throw new Error('Call rate not found');
      }
    } catch (error) {
      logger.error('Error retrieving call rate', error);
      throw error;
    }
  }

  async updateCallRate(id, updatedCallRateData) {
    try {
      const data = await this.newDatastore.readAll();
      const index = data.findIndex(item => item.type === 'call-rate' && item.data.id === id);
      if (index !== -1) {
        data[index] = { type: 'call-rate', data: updatedCallRateData };
        await this.newDatastore.writeAll(data);
        logger.log('Call rate updated successfully', updatedCallRateData);
      } else {
        logger.error('Call rate not found', { id });
        throw new Error('Call rate not found');
      }
    } catch (error) {
      logger.error('Error updating call rate', error);
      throw error;
    }
  }

  async deleteCallRate(id) {
    try {
      const data = await this.newDatastore.readAll();
      const updatedData = data.filter(item => item.type !== 'call-rate' || item.data.id !== id);
      await this.newDatastore.writeAll(updatedData);
      logger.log('Call rate deleted successfully', { id });
    } catch (error) {
      logger.error('Error deleting call rate', error);
      throw error;
    }
  }

  async getAllCallRates() {
    try {
      const data = await this.newDatastore.readAll();
      const callRates = data.filter(item => item.type === 'call-rate');
      logger.log('All call rates retrieved successfully', callRates);
      return callRates;
    } catch (error) {
      logger.error('Error retrieving all call rates', error);
      throw error;
    }
  }

  async getPersonalizationWaterfall() {
    try {
      const waterfall = this.config.personalizationWaterfall.sources;
      logger.log('Personalization waterfall retrieved successfully', waterfall);
      return waterfall;
    } catch (error) {
      logger.error('Error retrieving personalization waterfall', error);
      throw error;
    }
  }

  async sendMessage(data) {
    // Implement message sending logic here
  }
}

module.exports = DoubleWriteStrategy;
