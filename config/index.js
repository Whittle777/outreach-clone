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
    };
  }
};
