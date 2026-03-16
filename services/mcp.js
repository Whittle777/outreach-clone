// services/mcp.js

const crypto = require('crypto');

class MCP {
  constructor() {
    this.protocolVersion = '1.0';
    this.secretKey = 'your-secret-key'; // This should be securely managed and not hardcoded in production
  }

  encrypt(data) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(this.secretKey, 'hex'), iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + encrypted;
  }

  decrypt(encryptedData) {
    const iv = Buffer.from(encryptedData.slice(0, 32), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(this.secretKey, 'hex'), iv);
    let decrypted = decipher.update(encryptedData.slice(32), 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  sign(data) {
    return crypto.createHmac('sha256', this.secretKey).update(data).digest('hex');
  }

  verify(data, signature) {
    const hmac = crypto.createHmac('sha256', this.secretKey);
    hmac.update(data);
    const calculatedSignature = hmac.digest('hex');
    return calculatedSignature === signature;
  }
}

module.exports = new MCP();
