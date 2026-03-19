const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

class AudioStorage {
  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });
    this.bucketName = process.env.AWS_BUCKET_NAME;
  }

  async uploadAudioFile(fileName, filePath) {
    const fileContent = fs.readFileSync(filePath);
    const params = {
      Bucket: this.bucketName,
      Key: fileName,
      Body: fileContent,
      ContentType: 'audio/wav', // or 'audio/mp3'
    };

    const uploadResult = await this.s3.upload(params).promise();
    return uploadResult.Location;
  }

  async retrieveAudioFile(fileId) {
    const params = {
      Bucket: this.bucketName,
      Key: fileId,
    };

    const fileData = await this.s3.getObject(params).promise();
    return fileData.Body;
  }
}

module.exports = new AudioStorage();
