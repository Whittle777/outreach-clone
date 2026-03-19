// services/doubleWriteStrategy.js

class DoubleWriteStrategy {
  async write(data) {
    // Simulate writing to a legacy datastore
    // For now, let's assume it's a no-op
    console.log('Writing to legacy datastore:', data);
    // In a real-world scenario, you would implement the actual write logic here
  }
}

module.exports = new DoubleWriteStrategy();
