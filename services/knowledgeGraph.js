const doubleWriteStrategy = require('../services/doubleWriteStrategy');
const logger = require('../services/logger');

class KnowledgeGraph {
  constructor() {
    // Initialize any necessary properties here
  }

  async write(data) {
    try {
      await doubleWriteStrategy.write(data);
      logger.log('Data written to KnowledgeGraph successfully', data);
    } catch (error) {
      logger.error('Error writing data to KnowledgeGraph', error);
      throw error;
    }
  }

  // Add other methods of KnowledgeGraph class here
}

module.exports = KnowledgeGraph;
