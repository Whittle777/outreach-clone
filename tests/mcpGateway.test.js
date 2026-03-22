const MCPGateway = require('../services/mcpGateway');
const assert = require('assert');
const axios = require('axios');
const sinon = require('sinon');

describe('MCPGateway', function() {
  let mcpGateway;
  let axiosPostStub;
  let axiosGetStub;

  beforeEach(function() {
    mcpGateway = new MCPGateway('https://api.example.com/mcp', 'your-api-key', 'your-secret-key');
    axiosPostStub = sinon.stub(axios, 'post');
    axiosGetStub = sinon.stub(axios, 'get');
  });

  afterEach(function() {
    axiosPostStub.restore();
    axiosGetStub.restore();
  });

  it('should send data to the MCP Gateway', async function() {
    const data = { key: 'value' };
    const encryptedData = { encrypted: 'data' };
    const response = { data: { success: true, message: 'Data sent successfully' } };

    axiosPostStub.resolves(response);
    sinon.stub(mcpGateway.encryption, 'encrypt').returns(encryptedData);

    const result = await mcpGateway.sendData(data);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.message, 'Data sent successfully');
    assert.deepStrictEqual(result.data, response.data);

    sinon.assert.calledOnceWithExactly(axiosPostStub, `${mcpGateway.apiUrl}/send`, encryptedData, {
      headers: {
        'Authorization': `Bearer ${mcpGateway.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  });

  it('should handle errors when sending data to the MCP Gateway', async function() {
    const data = { key: 'value' };
    const error = new Error('Network Error');

    axiosPostStub.rejects(error);

    const result = await mcpGateway.sendData(data);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.message, 'Failed to send data');
    assert.strictEqual(result.error, error.message);

    sinon.assert.calledOnceWithExactly(axiosPostStub, `${mcpGateway.apiUrl}/send`, data, {
      headers: {
        'Authorization': `Bearer ${mcpGateway.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  });

  it('should receive data from the MCP Gateway', async function() {
    const encryptedData = { encrypted: 'data' };
    const decryptedData = { key: 'value' };
    const response = { data: encryptedData };

    axiosGetStub.resolves(response);
    sinon.stub(mcpGateway.encryption, 'decrypt').returns(decryptedData);

    const result = await mcpGateway.receiveData();

    assert.strictEqual(result.success, true);
    assert.deepStrictEqual(result.data, decryptedData);

    sinon.assert.calledOnceWithExactly(axiosGetStub, `${mcpGateway.apiUrl}/receive`, {
      headers: {
        'Authorization': `Bearer ${mcpGateway.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  });

  it('should handle errors when receiving data from the MCP Gateway', async function() {
    const error = new Error('Network Error');

    axiosGetStub.rejects(error);

    const result = await mcpGateway.receiveData();

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.message, 'Failed to receive data');
    assert.strictEqual(result.error, error.message);

    sinon.assert.calledOnceWithExactly(axiosGetStub, `${mcpGateway.apiUrl}/receive`, {
      headers: {
        'Authorization': `Bearer ${mcpGateway.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  });
});
