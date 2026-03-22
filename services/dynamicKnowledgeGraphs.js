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

  visualizeGraph() {
    // Placeholder for graph visualization logic
    // This could involve converting the graph to a format suitable for visualization libraries
    return JSON.stringify(this.graph, null, 2);
  }
}

module.exports = new DynamicKnowledgeGraphs();
