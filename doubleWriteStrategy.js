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

      // Check for conflict in the new datastore
      const conflict = await this.newDatastore.checkForConflict(data);
      if (conflict) {
        logger.error('Conflict detected in new datastore:', conflict);
        // Handle conflict, e.g., log, alert, or retry
        this.handleConflict(conflict);
      } else {
        await this.newDatastore.write(data);
        logger.log('New datastore write successful', data);
        logger.log('Double-write successful');
      }
    } catch (error) {
      logger.error('Double-write failed:', error);
      throw error;
    }
  }

  handleConflict(conflict) {
    // Implement conflict handling logic
    // For now, we'll just log the conflict
    logger.error('Handling conflict:', conflict);
    // Additional handling logic can be added here
  }
}

module.exports = new DoubleWriteStrategy();
