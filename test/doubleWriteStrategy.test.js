// test/doubleWriteStrategy.test.js

const assert = require('assert');
const DoubleWriteStrategy = require('../services/doubleWriteStrategy');
const fs = require('fs');
const path = require('path');

// Mock datastores
class LegacyDatastore {
  constructor() {
    this.data = [];
  }

  async write(data) {
    this.data.push(data);
  }

  async readAll() {
    return this.data;
  }

  async writeAll(data) {
    this.data = data;
  }
}

class NewDatastore {
  constructor() {
    this.data = [];
  }

  async write(data) {
    this.data.push(data);
  }

  async migrateFrom(legacyDatastore) {
    this.data = await legacyDatastore.readAll();
  }
}

describe('DoubleWriteStrategy', function() {
  let doubleWriteStrategy;
  let legacyDatastore;
  let newDatastore;

  beforeEach(function() {
    doubleWriteStrategy = new DoubleWriteStrategy();
    legacyDatastore = new LegacyDatastore();
    newDatastore = new NewDatastore();
    doubleWriteStrategy.setLegacyDatastore(legacyDatastore);
    doubleWriteStrategy.setNewDatastore(newDatastore);
  });

  it('should write data to both datastores', async function() {
    const sampleData = { id: 1, name: 'Test' };
    await doubleWriteStrategy.write(sampleData);
    assert.deepStrictEqual(legacyDatastore.data, [sampleData]);
    assert.deepStrictEqual(newDatastore.data, [sampleData]);
  });

  it('should backup data from legacy datastore', async function() {
    const sampleData = [{ id: 1, name: 'Test1' }, { id: 2, name: 'Test2' }];
    await legacyDatastore.writeAll(sampleData);
    await doubleWriteStrategy.backup();
    const backupPath = path.join(__dirname, '../services/rollback_backup.json');
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    assert.deepStrictEqual(backupData, sampleData);
  });

  it('should rollback data to legacy datastore from backup', async function() {
    const sampleData = [{ id: 1, name: 'Test1' }, { id: 2, name: 'Test2' }];
    await legacyDatastore.writeAll(sampleData);
    await doubleWriteStrategy.backup();
    await legacyDatastore.writeAll([{ id: 3, name: 'Test3' }]);
    await doubleWriteStrategy.rollback();
    assert.deepStrictEqual(legacyDatastore.data, sampleData);
  });

  it('should simulate migration and rollback on failure', async function() {
    const sampleData = [{ id: 1, name: 'Test1' }, { id: 2, name: 'Test2' }];
    await legacyDatastore.writeAll(sampleData);
    await doubleWriteStrategy.backup();
    await doubleWriteStrategy.simulateMigration();
    assert.deepStrictEqual(newDatastore.data, sampleData);
    await newDatastore.writeAll([{ id: 3, name: 'Test3' }]);
    await doubleWriteStrategy.simulateMigration();
    assert.deepStrictEqual(legacyDatastore.data, sampleData);
  });

  it('should store audio file', async function() {
    const fileData = {
      key: 'test-audio-file.wav',
      body: Buffer.from('audio data'),
      contentType: 'audio/wav',
    };
    await doubleWriteStrategy.storeAudioFile(fileData);
    // Add assertions to verify the file was stored correctly
  });

  it('should process sentiment analysis', async function() {
    const prospectId = 1;
    const sentimentData = { score: 0.8, label: 'positive' };
    await doubleWriteStrategy.processSentimentAnalysis(prospectId, sentimentData);
    assert.deepStrictEqual(legacyDatastore.data, [{ type: 'sentiment-analysis', data: { prospectId, sentimentData } }]);
    assert.deepStrictEqual(newDatastore.data, [{ type: 'sentiment-analysis', data: { prospectId, sentimentData } }]);
  });

  it('should create call rate', async function() {
    const callRateData = { phoneNumber: '1234567890', rate: 10 };
    await doubleWriteStrategy.createCallRate(callRateData);
    assert.deepStrictEqual(legacyDatastore.data, [{ type: 'call-rate', data: callRateData }]);
    assert.deepStrictEqual(newDatastore.data, [{ type: 'call-rate', data: callRateData }]);
  });

  it('should retrieve call rate by id', async function() {
    const callRateData = { phoneNumber: '1234567890', rate: 10 };
    await doubleWriteStrategy.createCallRate(callRateData);
    const callRate = await doubleWriteStrategy.getCallRateById(1);
    assert.deepStrictEqual(callRate, { type: 'call-rate', data: callRateData });
  });

  it('should update call rate', async function() {
    const callRateData = { phoneNumber: '1234567890', rate: 10 };
    await doubleWriteStrategy.createCallRate(callRateData);
    const updatedCallRateData = { phoneNumber: '1234567890', rate: 15 };
    await doubleWriteStrategy.updateCallRate(1, updatedCallRateData);
    assert.deepStrictEqual(legacyDatastore.data, [{ type: 'call-rate', data: updatedCallRateData }]);
    assert.deepStrictEqual(newDatastore.data, [{ type: 'call-rate', data: updatedCallRateData }]);
  });

  it('should delete call rate', async function() {
    const callRateData = { phoneNumber: '1234567890', rate: 10 };
    await doubleWriteStrategy.createCallRate(callRateData);
    await doubleWriteStrategy.deleteCallRate(1);
    assert.deepStrictEqual(legacyDatastore.data, []);
    assert.deepStrictEqual(newDatastore.data, []);
  });

  it('should retrieve all call rates', async function() {
    const callRateData1 = { phoneNumber: '1234567890', rate: 10 };
    const callRateData2 = { phoneNumber: '0987654321', rate: 15 };
    await doubleWriteStrategy.createCallRate(callRateData1);
    await doubleWriteStrategy.createCallRate(callRateData2);
    const callRates = await doubleWriteStrategy.getAllCallRates();
    assert.deepStrictEqual(callRates, [
      { type: 'call-rate', data: callRateData1 },
      { type: 'call-rate', data: callRateData2 }
    ]);
  });

  it('should get personalization waterfall', async function() {
    const waterfall = await doubleWriteStrategy.getPersonalizationWaterfall();
    assert.deepStrictEqual(waterfall, [
      'fundraisingNews',
      'linkedinPosts',
      'technographicData',
      'companyWebsite',
      'socialMedia'
    ]);
  });

  it('should handle errors during double-write', async function() {
    const sampleData = { id: 1, name: 'Test' };
    const legacyWriteError = new Error('Legacy datastore write failed');
    const newDatastoreWriteError = new Error('New datastore write failed');

    legacyDatastore.write = async () => { throw legacyWriteError; };
    newDatastore.write = async () => { throw newDatastoreWriteError; };

    try {
      await doubleWriteStrategy.write(sampleData);
    } catch (error) {
      assert.strictEqual(error, newDatastoreWriteError);
    }

    assert.deepStrictEqual(legacyDatastore.data, []);
    assert.deepStrictEqual(newDatastore.data, []);
  });

  it('should handle errors during backup', async function() {
    const sampleData = [{ id: 1, name: 'Test1' }, { id: 2, name: 'Test2' }];
    const backupError = new Error('Backup failed');

    fs.writeFileSync = () => { throw backupError; };

    try {
      await doubleWriteStrategy.backup();
    } catch (error) {
      assert.strictEqual(error, backupError);
    }

    const backupPath = path.join(__dirname, '../services/rollback_backup.json');
    assert.strictEqual(fs.existsSync(backupPath), false);
  });

  it('should handle errors during rollback', async function() {
    const sampleData = [{ id: 1, name: 'Test1' }, { id: 2, name: 'Test2' }];
    const rollbackError = new Error('Rollback failed');

    fs.writeFileSync = () => { throw rollbackError; };

    try {
      await doubleWriteStrategy.rollback();
    } catch (error) {
      assert.strictEqual(error, rollbackError);
    }

    const backupPath = path.join(__dirname, '../services/rollback_backup.json');
    assert.strictEqual(fs.existsSync(backupPath), false);
  });

  it('should handle errors during migration', async function() {
    const sampleData = [{ id: 1, name: 'Test1' }, { id: 2, name: 'Test2' }];
    const migrationError = new Error('Migration failed');

    newDatastore.migrateFrom = async () => { throw migrationError; };

    try {
      await doubleWriteStrategy.simulateMigration();
    } catch (error) {
      assert.strictEqual(error, migrationError);
    }

    assert.deepStrictEqual(newDatastore.data, []);
  });

  it('should handle errors during audio file storage', async function() {
    const fileData = {
      key: 'test-audio-file.wav',
      body: Buffer.from('audio data'),
      contentType: 'audio/wav',
    };
    const storageError = new Error('Audio file storage failed');

    doubleWriteStrategy.audioStorage.store = async () => { throw storageError; };

    try {
      await doubleWriteStrategy.storeAudioFile(fileData);
    } catch (error) {
      assert.strictEqual(error, storageError);
    }
  });

  it('should handle errors during sentiment analysis processing', async function() {
    const prospectId = 1;
    const sentimentData = { score: 0.8, label: 'positive' };
    const processingError = new Error('Sentiment analysis processing failed');

    doubleWriteStrategy.sentimentAnalysis.process = async () => { throw processingError; };

    try {
      await doubleWriteStrategy.processSentimentAnalysis(prospectId, sentimentData);
    } catch (error) {
      assert.strictEqual(error, processingError);
    }
  });
});
