const crypto = require('crypto');
const doubleWriteStrategy = require('../services/doubleWriteStrategy');
const logger = require('../services/logger');
const AIGenerator = require('../services/aiGenerator');

class MCP {
  constructor() {
    this.protocolVersion = '1.0';
    this.secretKey = process.env.MCP_SECRET_KEY || 'your-secret-key'; // Use environment variable for secret key
    this.aiGenerator = new AIGenerator(); // Add this line
  }

  encrypt(data) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(this.secretKey, 'hex'), iv);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { iv: iv.toString('hex'), encryptedData: encrypted };
  }

  decrypt(encryptedData) {
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(this.secretKey, 'hex'), iv);
    let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }

  async write(data) {
    try {
      await doubleWriteStrategy.write(data);
      logger.log('Data written to MCP successfully', data);
    } catch (error) {
      logger.error('Error writing data to MCP', error);
      throw error;
    }
  }

  async routeByConfidenceScore(confidenceScore, data) {
    if (confidenceScore > 85) {
      // High confidence: AI executes autonomously
      await this.write({ type: 'high-confidence', data });
      logger.log('High confidence, AI executes autonomously', data);
    } else if (confidenceScore >= 70) {
      // Moderate confidence: action paused and routed to review queue
      await this.write({ type: 'moderate-confidence', data });
      logger.log('Moderate confidence, routed to review queue', data);
    } else {
      // Low confidence: workflow halts with high-priority supervisor notifications
      await this.write({ type: 'low-confidence', data });
      logger.log('Low confidence, workflow halted with supervisor notifications', data);
    }
  }
}

module.exports = MCP;
