const neo4j = require('neo4j-driver');
const doubleWriteStrategy = require('../services/doubleWriteStrategy');
const DealHealthScore = require('../models/dealHealthScore');
const logger = require('../services/logger');

class KnowledgeGraph {
  constructor(uri, user, password) {
    this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  }

  async createNode(label, properties) {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `CREATE (n:${label} {${Object.keys(properties).map(key => `${key}: $${key}`).join(', ')}}) RETURN n`,
        properties
      );
      await doubleWriteStrategy.write(result.records[0].get(0).properties);
      return result.records[0].get(0).properties;
    } finally {
      await session.close();
    }
  }

  async createRelationship(startNodeLabel, startNodeId, endNodeLabel, endNodeId, relationshipType, properties) {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `MATCH (a:${startNodeLabel} {id: $startNodeId}), (b:${endNodeLabel} {id: $endNodeId}) ` +
        `CREATE (a)-[:${relationshipType} {${Object.keys(properties).map(key => `${key}: $${key}`).join(', ')}}]->(b) RETURN a, b`,
        { startNodeId, endNodeId, ...properties }
      );
      await doubleWriteStrategy.write(result.records[0].get(0).properties);
      return result.records[0].get(0).properties;
    } finally {
      await session.close();
    }
  }

  async createDealHealthScore(prospectId, metadata) {
    const session = this.driver.session();
    try {
      const dealHealthScore = await DealHealthScore.create(prospectId, metadata);
      const result = await session.run(
        `CREATE (d:DealHealthScore {prospectId: $prospectId, score: $score, status: $status, metadata: $metadata}) RETURN d`,
        dealHealthScore
      );
      await doubleWriteStrategy.write(result.records[0].get(0).properties);
      logger.log('Deal Health Score Created', dealHealthScore);
      return result.records[0].get(0).properties;
    } finally {
      await session.close();
    }
  }

  async close() {
    await this.driver.close();
  }

  async write(data) {
    // Implement double-write logic for legacy datastore
    // For now, let's assume it's a no-op
    return;
  }
}

module.exports = KnowledgeGraph;
