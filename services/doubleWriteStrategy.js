// services/doubleWriteStrategy.js

const logger = require('./logger');
const fs = require('fs');
const path = require('path');

class DoubleWriteStrategy {
  constructor() {
    this.legacyDatastore = null;
    this.newDatastore = null;
    this.backupPath = path.join(__dirname, 'backup.json');
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

  // Method to handle geographic routing based on country/region
  async routeData(data) {
    const { country } = data;
    if (!country) {
      throw new Error('Country/Region information is required');
    }

    // Example routing logic: route data to new datastore for specific countries
    const countriesForNewDatastore = ['US', 'CA', 'GB'];
    if (countriesForNewDatastore.includes(country)) {
      await this.newDatastore.write(data);
      logger.log('Data routed to new datastore', data);
    } else {
      await this.legacyDatastore.write(data);
      logger.log('Data routed to legacy datastore', data);
    }
  }
}

module.exports = new DoubleWriteStrategy();
