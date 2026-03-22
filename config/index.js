const dotenv = require('dotenv');
dotenv.config();

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
    };
  },
};
