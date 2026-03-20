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
    const backupPath = path.join(__dirname, '../services/backup.json');
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
});
