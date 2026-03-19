const neo4j = require('neo4j-driver');

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
      return result.records[0].get(0).properties;
    } finally {
      await session.close();
    }
  }

  async close() {
    await this.driver.close();
  }
}

module.exports = KnowledgeGraph;
