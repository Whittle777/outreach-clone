const axios = require('axios');
const MCPGatewayEncryption = require('./mcpGatewayEncryption');

class MCPGateway {
  constructor(apiUrl, apiKey, secretKey) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    this.encryption = new MCPGatewayEncryption(secretKey);
  }

  async sendData(data) {
    try {
      const encryptedData = this.encryption.encrypt(data);
      const response = await axios.post(`${this.apiUrl}/send`, encryptedData, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return {
        success: true,
        message: 'Data sent successfully',
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send data',
        error: error.message
      };
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
      const decryptedData = this.encryption.decrypt(response.data);
      return {
        success: true,
        data: decryptedData
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to receive data',
        error: error.message
      };
    }
  }
}

module.exports = MCPGateway;
