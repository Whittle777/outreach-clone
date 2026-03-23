const crypto = require('crypto');
const nodemailer = require('nodemailer');
const dkim = require('nodemailer-dkim');

module.exports = {
  getConfig: () => {
    return {
      azureAcsConnectionString: process.env.AZURE_ACS_CONNECTION_STRING,
      azureAcsQueueName: process.env.AZURE_ACS_QUEUE_NAME,
      azureSpeechApiKey: process.env.AZURE_SPEECH_API_KEY,
      azureSpeechRegion: process.env.AZURE_SPEECH_REGION,
      awsSqsUrl: process.env.AWS_SQS_URL,
      awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
      awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      awsRegion: process.env.AWS_REGION,
      refillRate: process.env.REFILL_RATE || 1, // Default refill rate of 1 token per second
      bucketCapacity: process.env.BUCKET_CAPACITY || 10, // Default bucket capacity of 10 tokens
      redisHost: process.env.REDIS_HOST || 'localhost',
      redisPort: process.env.REDIS_PORT || 6379,
      redisPassword: process.env.REDIS_PASSWORD || null,
      rateLimitRefillRate: process.env.RATE_LIMIT_REFILL_RATE || 1, // Default refill rate of 1 token per second
      rateLimitBucketCapacity: process.env.RATE_LIMIT_BUCKET_CAPACITY || 10, // Default bucket capacity of 10 tokens
      dnsApiKey: process.env.DNS_API_KEY, // New configuration for DNS API key
      dnsApiUrl: process.env.DNS_API_URL || 'https://api.example.com/dns', // Default DNS API URL
      dkimPrivateKey: process.env.DKIM_PRIVATE_KEY || generateDkimPrivateKey(),
      dkimSelector: process.env.DKIM_SELECTOR || 'default',
      dmarcPolicy: process.env.DMARC_POLICY || 'none', // Default DMARC policy
      crmSyncEnabled: process.env.CRM_SYNC_ENABLED || false, // Enable CRM synchronization
      crmSyncUrl: process.env.CRM_SYNC_URL, // CRM synchronization API URL
      crmSyncApiKey: process.env.CRM_SYNC_API_KEY, // CRM synchronization API key
      mcpGatewayUrl: process.env.MCP_GATEWAY_URL, // MCP Gateway URL
      mcpGatewayApiKey: process.env.MCP_GATEWAY_API_KEY, // MCP Gateway API key
    };
  },

  generateDkimPrivateKey: () => {
    const key = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });
    return key.privateKey;
  }
};
