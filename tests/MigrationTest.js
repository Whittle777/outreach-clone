const assert = require('assert');
const DoubleWriteStrategy = require('../services/doubleWriteStrategy');
const config = require('../services/config');
const logger = require('../services/logger');

describe('MigrationTest', function() {
  let doubleWriteStrategy;

  beforeEach(function() {
    doubleWriteStrategy = new DoubleWriteStrategy();
  });

  it('should write data to both legacy and new datastores', async function() {
    const testData = { key: 'value' };
    const legacyDatastore = {
      write: async (data) => {
        assert.deepStrictEqual(data, testData);
      },
      readAll: async () => {
        return [testData];
      }
    };
    const newDatastore = {
      write: async (data) => {
        assert.deepStrictEqual(data, testData);
      },
      readAll: async () => {
        return [testData];
      }
    };

    doubleWriteStrategy.setLegacyDatastore(legacyDatastore);
    doubleWriteStrategy.setNewDatastore(newDatastore);

    await doubleWriteStrategy.write(testData);
  });

  it('should backup data from legacy datastore', async function() {
    const testData = [{ key: 'value1' }, { key: 'value2' }];
    const legacyDatastore = {
      readAll: async () => {
        return testData;
      }
    };

    doubleWriteStrategy.setLegacyDatastore(legacyDatastore);

    await doubleWriteStrategy.backup();

    const backupData = JSON.parse(fs.readFileSync(config.getConfig().rollbackPlan.backupPath, 'utf8'));
    assert.deepStrictEqual(backupData, testData);
  });

  it('should rollback to backup data', async function() {
    const testData = [{ key: 'value1' }, { key: 'value2' }];
    const legacyDatastore = {
      writeAll: async (data) => {
        assert.deepStrictEqual(data, testData);
      }
    };

    doubleWriteStrategy.setLegacyDatastore(legacyDatastore);

    fs.writeFileSync(config.getConfig().rollbackPlan.backupPath, JSON.stringify(testData, null, 2));

    await doubleWriteStrategy.rollback();
  });

  it('should simulate migration successfully', async function() {
    const testData = [{ key: 'value1' }, { key: 'value2' }];
    const legacyDatastore = {
      readAll: async () => {
        return testData;
      }
    };
    const newDatastore = {
      migrateFrom: async (datastore) => {
        const data = await datastore.readAll();
        assert.deepStrictEqual(data, testData);
      }
    };

    doubleWriteStrategy.setLegacyDatastore(legacyDatastore);
    doubleWriteStrategy.setNewDatastore(newDatastore);

    await doubleWriteStrategy.simulateMigration();
  });

  it('should check data consistency between legacy and new datastores', async function() {
    const testData = [{ key: 'value1' }, { key: 'value2' }];
    const legacyDatastore = {
      readAll: async () => {
        return testData;
      }
    };
    const newDatastore = {
      readAll: async () => {
        return testData;
      }
    };

    doubleWriteStrategy.setLegacyDatastore(legacyDatastore);
    doubleWriteStrategy.setNewDatastore(newDatastore);

    const isConsistent = await doubleWriteStrategy.checkConsistency();
    assert.strictEqual(isConsistent, true);
  });
});
