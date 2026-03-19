const MCPGateway = require('../services/mcpGateway');
const assert = require('assert');

describe('MCPGateway', function() {
  let mcpGateway;

  beforeEach(function() {
    mcpGateway = new MCPGateway('https://api.example.com/mcp', 'your-api-key');
  });

  it('should send data to the MCP Gateway', async function() {
    const data = { key: 'value' };
    const response = await mcpGateway.sendData(data);
    assert.strictEqual(response.success, true);
    assert.strictEqual(response.message, 'Data sent successfully');
  });

  it('should receive data from the MCP Gateway', async function() {
    const response = await mcpGateway.receiveData();
    assert.strictEqual(response.success, true);
    assert.strictEqual(response.data.message, 'Data received successfully');
  });
});
