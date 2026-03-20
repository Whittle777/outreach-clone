const doubleWriteStrategy = require('./doubleWriteStrategy');
const logger = require('./logger');
const temporalStateManager = require('./temporalStateManager');

class MCP {
  constructor() {
    this.protocolVersion = '1.0';
    this.secretKey = process.env.MCP_SECRET_KEY || 'your-secret-key';
    this.aiGenerator = new AIGenerator();
    this.encryption = new Encryption(this.secretKey);
    this.azureServiceBus = config.initializeAzureServiceBus();
  }

  encrypt(data) {
    // Placeholder for encryption logic
    return this.encryption.encrypt(data);
  }

  async write(data) {
    try {
      await doubleWriteStrategy.write(data);
      logger.log('Data written to MCP successfully', data);
      temporalStateManager.saveState('write', data);
    } catch (error) {
      logger.error('Error writing data to MCP', error);
      throw error;
    }
  }

  async predictQuarterlyPerformance(data) {
    try {
      const prediction = await doubleWriteStrategy.predictQuarterlyPerformance(data);
      logger.log('Quarterly performance prediction successful', { prediction });
      return prediction;
    } catch (error) {
      logger.error('Error predicting quarterly performance', error);
      throw error;
    }
  }
}

module.exports = new MCP();
