// services/doubleWriteStrategy.js

const logger = require('./logger');

class DoubleWriteStrategy {
  constructor() {
    this.legacyDatastore = null;
    this.newDatastore = null;
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
      logger.log('Double-write successful');
    } catch (error) {
      logger.error('Double-write failed:', error);
      throw error;
    }
  }
}

module.exports = new DoubleWriteStrategy();
