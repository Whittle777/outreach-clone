const MCPGateway = require('../services/mcpGateway');
const axios = require('axios');
const sinon = require('sinon');

describe('MCPGateway', () => {
  let mcpGateway;
  let axiosPostStub;
  let axiosGetStub;

  beforeEach(() => {
    mcpGateway = new MCPGateway('https://api.example.com', 'test-api-key');
    axiosPostStub = sinon.stub(axios, 'post');
    axiosGetStub = sinon.stub(axios, 'get');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('sendData', () => {
    it('should send data successfully', async () => {
      const data = { key: 'value' };
      const response = { data: { success: true } };
      axiosPostStub.resolves(response);

      const result = await mcpGateway.sendData(data);

      expect(result).toEqual({
        success: true,
        message: 'Data sent successfully',
        data: response.data
      });
      expect(axiosPostStub.calledOnceWithExactly(`${mcpGateway.apiUrl}/send`, data, {
        headers: {
          'Authorization': `Bearer ${mcpGateway.apiKey}`,
          'Content-Type': 'application/json'
        }
      })).toBe(true);
    });

    it('should handle errors when sending data', async () => {
      const data = { key: 'value' };
      const error = new Error('Network Error');
      axiosPostStub.rejects(error);

      const result = await mcpGateway.sendData(data);

      expect(result).toEqual({
        success: false,
        message: 'Failed to send data',
        error: error.message
      });
      expect(axiosPostStub.calledOnceWithExactly(`${mcpGateway.apiUrl}/send`, data, {
        headers: {
          'Authorization': `Bearer ${mcpGateway.apiKey}`,
          'Content-Type': 'application/json'
        }
      })).toBe(true);
    });
  });

  describe('receiveData', () => {
    it('should receive data successfully', async () => {
      const response = { data: { key: 'value' } };
      axiosGetStub.resolves(response);

      const result = await mcpGateway.receiveData();

      expect(result).toEqual({
        success: true,
        data: response.data
      });
      expect(axiosGetStub.calledOnceWithExactly(`${mcpGateway.apiUrl}/receive`, {
        headers: {
          'Authorization': `Bearer ${mcpGateway.apiKey}`,
          'Content-Type': 'application/json'
        }
      })).toBe(true);
    });

    it('should handle errors when receiving data', async () => {
      const error = new Error('Network Error');
      axiosGetStub.rejects(error);

      const result = await mcpGateway.receiveData();

      expect(result).toEqual({
        success: false,
        message: 'Failed to receive data',
        error: error.message
      });
      expect(axiosGetStub.calledOnceWithExactly(`${mcpGateway.apiUrl}/receive`, {
        headers: {
          'Authorization': `Bearer ${mcpGateway.apiKey}`,
          'Content-Type': 'application/json'
        }
      })).toBe(true);
    });
  });
});
