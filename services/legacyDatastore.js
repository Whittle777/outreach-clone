class LegacyDatastore {
  constructor() {
    // Initialize connection to legacy datastore
  }

  async write(data) {
    // Implement write logic for legacy datastore
    console.log('Writing to legacy datastore:', data);
  }

  async readAll() {
    // Implement read all logic for legacy datastore
    return [];
  }

  async writeAll(data) {
    // Implement write all logic for legacy datastore
    console.log('Writing all to legacy datastore:', data);
  }
}

module.exports = LegacyDatastore;
