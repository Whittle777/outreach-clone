const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const logger = require('../services/logger');
const temporalStateManager = require('../services/temporalStateManager');
const slackIntegration = require('../services/slackIntegration');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const bucketName = process.env.AWS_S3_BUCKET_NAME;

async function uploadAudioFile(fileName, filePath) {
  const fileContent = fs.readFileSync(filePath);
  const params = {
    Bucket: bucketName,
    Key: fileName,
    Body: fileContent,
    ContentType: 'audio/mpeg', // Set the correct content type for audio files
  };
  try {
    const uploadResult = await s3.upload(params).promise();
    logger.audioFileStored({ fileName: uploadResult.Key, location: uploadResult.Location });
    temporalStateManager.saveState('audioFileStored', { fileName: uploadResult.Key, location: uploadResult.Location });
    slackIntegration.sendNotification(`Audio file stored: ${uploadResult.Key}`);
    return uploadResult.Location;
  } catch (error) {
    logger.error('Failed to upload audio file', { error, fileName });
    throw error;
  }
}

async function getAudioFileUrl(fileName) {
  const params = {
    Bucket: bucketName,
    Key: fileName,
  };
  try {
    const headResult = await s3.headObject(params).promise();
    return `https://${bucketName}.s3.amazonaws.com/${fileName}`;
  } catch (error) {
    logger.error('Failed to get audio file URL', { error, fileName });
    throw error;
  }
}

async function deleteAudioFile(fileName) {
  const params = {
    Bucket: bucketName,
    Key: fileName,
  };
  try {
    await s3.deleteObject(params).promise();
    logger.info('Audio file deleted', { fileName });
    temporalStateManager.saveState('audioFileDeleted', { fileName });
    slackIntegration.sendNotification(`Audio file deleted: ${fileName}`);
  } catch (error) {
    logger.error('Failed to delete audio file', { error, fileName });
    throw error;
  }
}

module.exports = {
  uploadAudioFile,
  getAudioFileUrl,
  deleteAudioFile,
};
