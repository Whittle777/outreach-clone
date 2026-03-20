const axios = require('axios');
const logger = require('../services/logger');

class KnowledgeGraphService {
  constructor(apiKey, apiUrl) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
  }

  async createKnowledgeGraph(prospectId) {
    try {
      const response = await axios.post(`${this.apiUrl}/knowledge-graphs`, {
        prospectId,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      logger.log('AI Decision: Created Knowledge Graph', { prospectId, knowledgeGraphId: response.data.id });
      return response.data;
    } catch (error) {
      logger.error('AI Decision: Failed to Create Knowledge Graph', { prospectId, error: error.message });
      throw new Error(`Failed to create knowledge graph: ${error.message}`);
    }
  }

  async visualizeKnowledgeGraph(knowledgeGraphId) {
    try {
      const response = await axios.get(`${this.apiUrl}/knowledge-graphs/${knowledgeGraphId}/visualize`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      logger.log('AI Decision: Visualized Knowledge Graph', { knowledgeGraphId });
      return response.data;
    } catch (error) {
      logger.error('AI Decision: Failed to Visualize Knowledge Graph', { knowledgeGraphId, error: error.message });
      throw new Error(`Failed to visualize knowledge graph: ${error.message}`);
    }
  }
}

module.exports = KnowledgeGraphService;
