const logger = require('../services/logger');

class DynamicKnowledgeGraphs {
  constructor() {
    this.graph = {};
  }

  addNode(prospect) {
    if (!this.graph[prospect.id]) {
      this.graph[prospect.id] = {
        id: prospect.id,
        name: prospect.name,
        email: prospect.email,
        connections: [],
      };
    }
  }

  addConnection(prospectId, connectedProspectId) {
    if (this.graph[prospectId] && this.graph[connectedProspectId]) {
      this.graph[prospectId].connections.push(connectedProspectId);
      this.graph[connectedProspectId].connections.push(prospectId);
    } else {
      logger.error('One or both prospects do not exist in the graph', { prospectId, connectedProspectId });
    }
  }

  getGraph() {
    return this.graph;
  }
}

module.exports = new DynamicKnowledgeGraphs();
