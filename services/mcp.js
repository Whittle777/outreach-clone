// services/mcp.js

const crypto = require('crypto');

class MCP {
  constructor() {
    this.protocolVersion = '1.0';
    this.secretKey = 'your-secret-key'; // This should be securely managed and not hardcoded in production
  }

  encrypt(data) {
    const cipher = crypto.createCipher('aes-256-cbc', this.secretKey, crypto.randomBytes(16));
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  decrypt(encryptedData) {
    const decipher = crypto.createDecipher('aes-256-cbc', this.secretKey, Buffer.from(encryptedData.slice(0, 32), 'hex'));
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
