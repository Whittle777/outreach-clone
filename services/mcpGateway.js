const axios = require('axios');

class MCPGateway {
  constructor(apiUrl, apiKey) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  async sendData(data) {
    try {
      const response = await axios.post(`${this.apiUrl}/send`, data, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return { success: true, message: 'Data sent successfully', data: response.data };
    } catch (error) {
      console.error('Error sending data to MCP Gateway:', error);
      return { success: false, message: 'Failed to send data', error: error.message };
    }
  }

  async receiveData() {
    try {
      const response = await axios.get(`${this.apiUrl}/receive`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error receiving data from MCP Gateway:', error);
      return { success: false, message: 'Failed to receive data', error: error.message };
    }
  }
}

module.exports = MCPGateway;
