const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

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
  const uploadResult = await s3.upload(params).promise();
  return uploadResult.Location;
}

async function getAudioFileUrl(fileName) {
  const params = {
    Bucket: bucketName,
    Key: fileName,
  };
  const headResult = await s3.headObject(params).promise();
  return `https://${bucketName}.s3.amazonaws.com/${fileName}`;
}

module.exports = {
  uploadAudioFile,
  getAudioFileUrl,
};
