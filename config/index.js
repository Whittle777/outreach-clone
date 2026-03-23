const dotenv = require('dotenv');
dotenv.config();
const redis = require('redis');

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
      messageBrokerType: process.env.MESSAGE_BROKER_TYPE || 'azureServiceBus', // Default to Azure Service Bus
      kafkaHost: process.env.KAFKA_HOST || 'localhost:9092', // Default to local Kafka broker
      microsoftBackendUrl: process.env.MICROSOFT_BACKEND_URL,
      microsoftBackendApiKey: process.env.MICROSOFT_BACKEND_API_KEY,
      prisma: {
        url: process.env.DATABASE_URL,
      },
      sharding: {
        numberOfShards: parseInt(process.env.NUMBER_OF_SHARDS) || 10,
        shardKey: process.env.SHARD_KEY || 'bento',
      },
      geographicRouting: {
        enabled: process.env.GEOGRAPHIC_ROUTING_ENABLED === 'true',
        region: process.env.GEOGRAPHIC_ROUTING_REGION || 'us-west-2',
      },
      tenantIsolation: {
        enabled: process.env.TENANT_ISOLATION_ENABLED === 'true',
      },
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI,
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
      },
      microsoft: {
        clientId: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        redirectUri: process.env.MICROSOFT_REDIRECT_URI,
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        userInfoUrl: 'https://graph.microsoft.com/oidc/userinfo',
      },
      webhook: {
        port: process.env.WEBHOOK_PORT || 3001,
        path: process.env.WEBHOOK_PATH || '/webhook',
      },
      headerBasedSync: {
        enabled: process.env.HEADER_BASED_SYNC_ENABLED === 'true',
        headerName: process.env.HEADER_BASED_SYNC_HEADER_NAME || 'X-Sync-Header',
        headerValue: process.env.HEADER_BASED_SYNC_HEADER_VALUE || 'sync-value',
      },
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
      },
    };
  },
  getRedisClient: () => {
    const config = module.exports.getConfig();
    return redis.createClient({
      host: config.redis.host,
      port: config.redis.port,
    });
  },
};
