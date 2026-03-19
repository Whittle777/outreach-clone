// services/migrationTest.js

const doubleWriteStrategy = require('./doubleWriteStrategy');
const logger = require('./logger');

class MigrationTest {
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

  async runMigrationTest() {
    try {
      doubleWriteStrategy.setLegacyDatastore(this.legacyDatastore);
      doubleWriteStrategy.setNewDatastore(this.newDatastore);
      await doubleWriteStrategy.simulateMigration();
      logger.log('Migration test completed successfully');
    } catch (error) {
      logger.error('Migration test failed:', error);
    }
  }
}

module.exports = new MigrationTest();
