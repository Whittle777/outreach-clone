const doubleWriteStrategy = require('../services/doubleWriteStrategy');
const logger = require('../services/logger');

class KnowledgeGraph {
  constructor() {
    // Initialize any necessary properties here
  }

  async write(data) {
    try {
      await doubleWriteStrategy.write(data);
      logger.log('Data written to KnowledgeGraph successfully', data);
    } catch (error) {
      logger.error('Error writing data to KnowledgeGraph', error);
      throw error;
    }
  }

  async createCallRate(callRateData) {
    try {
      await doubleWriteStrategy.createCallRate(callRateData);
      logger.log('Call rate created in KnowledgeGraph successfully', callRateData);
    } catch (error) {
      logger.error('Error creating call rate in KnowledgeGraph', error);
      throw error;
    }
  }

  async getCallRateById(id) {
    try {
      const callRate = await doubleWriteStrategy.getCallRateById(id);
      logger.log('Call rate retrieved from KnowledgeGraph successfully', callRate);
      return callRate;
    } catch (error) {
      logger.error('Error retrieving call rate from KnowledgeGraph', error);
      throw error;
    }
  }

  async updateCallRate(id, callRateData) {
    try {
      const callRate = await doubleWriteStrategy.updateCallRate(id, callRateData);
      logger.log('Call rate updated in KnowledgeGraph successfully', callRate);
    } catch (error) {
      logger.error('Error updating call rate in KnowledgeGraph', error);
      throw error;
    }
  }

  async deleteCallRate(id) {
    try {
      const callRate = await doubleWriteStrategy.deleteCallRate(id);
      logger.log('Call rate deleted from KnowledgeGraph successfully', callRate);
    } catch (error) {
      logger.error('Error deleting call rate from KnowledgeGraph', error);
      throw error;
    }
  }

  async getAllCallRates() {
    try {
      const callRates = await doubleWriteStrategy.getAllCallRates();
      logger.log('All call rates retrieved from KnowledgeGraph successfully', callRates);
      return callRates;
    } catch (error) {
      logger.error('Error retrieving all call rates from KnowledgeGraph', error);
      throw error;
    }
  }

  // Add other methods of KnowledgeGraph class here
}

module.exports = KnowledgeGraph;
