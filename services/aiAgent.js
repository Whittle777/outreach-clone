// services/aiAgent.js

const mcp = require('./mcp');
const TaskQueue = require('./taskQueue');
const taskQueue = new TaskQueue();

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

    // Update task status to SENT
    await taskQueue.updateTask(task.id, 'SENT');

    // Send the task to the central AI agent
    await this.mcp.sendToCentralAI(task);
  }

  async receiveResult(encryptedResult, signature) {
    if (!this.mcp.verify(encryptedResult, signature)) {
      throw new Error('Invalid signature');
    }

    const result = JSON.parse(this.mcp.decrypt(encryptedResult));
    console.log('Received result from AI agent:', result);

    // Update task status to COMPLETED
    await taskQueue.updateTask(result.taskId, 'COMPLETED');

    return result;
  }

  async executeTask(task) {
    // Simulate task execution logic
    console.log('Executing task:', task);

    // Simulate some processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate a result
    const result = {
      taskId: task.id,
      status: 'SUCCESS',
      data: {
        // Add any relevant data from the task execution
      }
    };

    // Send the result back to the AI agent
    await this.sendResult(result);
  }

  async sendResult(result) {
    const encryptedResult = this.mcp.encrypt(JSON.stringify(result));
    const signature = this.mcp.sign(encryptedResult);

    // Simulate sending the result back to the AI agent
    console.log('Sending result back to AI agent:', encryptedResult, signature);
    // In a real implementation, you would send this back to the AI agent via a network call
  }

  verify(encryptedData, signature) {
    const calculatedSignature = crypto.createHmac('sha256', this.mcp.secretKey)
      .update(encryptedData)
      .digest('hex');
    return calculatedSignature === signature;
  }
}

module.exports = new AIAgent();
