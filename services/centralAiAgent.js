// services/centralAiAgent.js

const axios = require('axios');
const mcp = require('./mcp');

class CentralAiAgent {
  constructor() {
    this.aiAgentUrl = process.env.AI_AGENT_URL || 'http://central-ai-agent.com'; // Use environment variable for AI agent URL
  }

  async sendData(data) {
    const encryptedData = mcp.encrypt(data);
    const signature = mcp.sign(encryptedData);

    try {
      const response = await axios.post(`${this.aiAgentUrl}/data`, {
        encryptedData,
        signature,
      });
      return response.data;
    } catch (error) {
      console.error('Error sending data to central AI agent:', error);
      throw new Error('Failed to send data to central AI agent');
    }
  }

  async receiveData(encryptedData, signature) {
    if (!mcp.verify(encryptedData, signature)) {
      throw new Error('Invalid signature');
    }

    const decryptedData = mcp.decrypt(encryptedData);
    return decryptedData;
  }
}

module.exports = new CentralAiAgent();
