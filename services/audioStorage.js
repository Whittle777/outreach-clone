const AWS = require('aws-sdk');
const logger = require('../services/logger');

class AudioStorage {
  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });
    this.bucketName = process.env.AWS_BUCKET_NAME;
  }

  async store(fileData) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: fileData.key,
        Body: fileData.body,
        ContentType: fileData.contentType,
      };
      const result = await this.s3.upload(params).promise();
      logger.audioFileStored(result);
      return result;
    } catch (error) {
      logger.error('Failed to store audio file', error);
      throw error;
    }
  }
}

module.exports = AudioStorage;
