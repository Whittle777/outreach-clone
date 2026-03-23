// path/to/predictionService.js

const axios = require('axios');
const DnsManager = require('../services/dnsManager');
const config = require('../config');
const logger = require('../services/logger');
const TemporalStateManager = require('../services/temporalStateManager');

class PredictionService {
  constructor(apiKey, bento) {
    this.apiKey = apiKey;
    this.bento = bento;
    this.apiUrl = 'https://api.example.com/predict'; // Replace with actual API URL
    this.dnsManager = new DnsManager(config.getConfig().dnsApiKey, bento);
    this.temporalStateManager = new TemporalStateManager();
  }

  async predict(quarterData) {
    try {
      const response = await axios.post(this.apiUrl, { ...quarterData, bento: this.bento }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Prediction service error:', error);
      throw new Error('Failed to get prediction');
    }
  }

  async updateSpfRecord(domain, spfRecord) {
    try {
      const response = await this.dnsManager.updateSpfRecord(domain, spfRecord);
      return response;
    } catch (error) {
      console.error('SPF record update error:', error);
      throw new Error('Failed to update SPF record');
    }
  }

  async retrySoftBounce(domain, spfRecord, maxRetries = 5, retryDelay = 1000) {
    let retries = 0;
    while (retries < maxRetries) {
      try {
        const response = await this.dnsManager.updateSpfRecord(domain, spfRecord);
        logger.info('SPF record updated successfully', { domain, spfRecord });
        return response;
      } catch (error) {
        retries++;
        if (retries < maxRetries) {
          logger.warn('SPF record update failed, retrying...', { domain, spfRecord, retries });
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          logger.error('SPF record update failed after max retries', { domain, spfRecord, retries });
          throw new Error('Failed to update SPF record after max retries');
        }
      }
    }
  }

  async handleHardBounce(prospectId) {
    try {
      // Set the state to 'Failed' for the prospect
      this.temporalStateManager.saveState(`prospect_${prospectId}`, { status: 'Failed' });
      logger.info('Prospect status updated to Failed', { prospectId });
    } catch (error) {
      console.error('Failed to update prospect status to Failed', error);
      throw new Error('Failed to update prospect status to Failed');
    }
  }

  async recordTrackingPixelEvent(prospectId, event) {
    try {
      // Save the tracking pixel event to the state manager
      this.temporalStateManager.saveTrackingPixelEvent(prospectId, event);
      logger.trackingPixelEvent('Tracking pixel event recorded', { prospectId, event });

      // Send the tracking pixel event to Kafka
      await kafkaProducer.sendTrackingPixelEventMessage({ prospectId, event });
    } catch (error) {
      console.error('Failed to record tracking pixel event', error);
      throw new Error('Failed to record tracking pixel event');
    }
  }

  async updateOpenRate(prospectId, openRate) {
    try {
      // Save the open rate to the state manager
      this.temporalStateManager.saveOpenRateState(prospectId, openRate);
      logger.openRate('Open rate updated', { prospectId, openRate });

      // Send the open rate event to Kafka
      await kafkaProducer.sendOpenRateEventMessage({ prospectId, openRate });
    } catch (error) {
      console.error('Failed to update open rate', error);
      throw new Error('Failed to update open rate');
    }
  }

  async addNgoeTask(taskId, taskData) {
    try {
      // Save the NGOE task to the state manager
      this.temporalStateManager.saveNgoeTask(taskId, taskData);
      logger.info('NGOE task added', { taskId, taskData });

      // Send the NGOE task to Kafka
      await kafkaProducer.sendNgoeTaskMessage({ taskId, taskData });
    } catch (error) {
      console.error('Failed to add NGOE task', error);
      throw new Error('Failed to add NGOE task');
    }
  }

  async updateNgoeTaskQueue(taskQueue) {
    try {
      // Save the NGOE task queue to the state manager
      this.temporalStateManager.saveNgoeTaskQueue(taskQueue);
      logger.info('NGOE task queue updated', { taskQueue });

      // Send the NGOE task queue to Kafka
      await kafkaProducer.sendNgoeTaskQueueMessage({ taskQueue });
    } catch (error) {
      console.error('Failed to update NGOE task queue', error);
      throw new Error('Failed to update NGOE task queue');
    }
  }
}

module.exports = PredictionService;
