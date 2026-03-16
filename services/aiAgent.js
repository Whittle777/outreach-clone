// services/aiAgent.js

const mcp = require('./mcp');

class AIAgent {
  constructor() {
    this.mcp = mcp;
  }

  async sendTask(task) {
    const encryptedTask = this.mcp.encrypt(JSON.stringify(task));
    const signature = this.mcp.sign(encryptedTask);

    // Simulate sending the task to the AI agent
    console.log('Sending task to AI agent:', encryptedTask, signature);
    // In a real implementation, you would send this to the AI agent via a network call
  }

  async receiveResult(encryptedResult, signature) {
    if (!this.mcp.verify(encryptedResult, signature)) {
      throw new Error('Invalid signature');
    }

    const result = JSON.parse(this.mcp.decrypt(encryptedResult));
    console.log('Received result from AI agent:', result);
    return result;
  }
}

module.exports = new AIAgent();
