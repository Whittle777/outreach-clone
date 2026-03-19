const AWS = require('aws-sdk');
const fs = require('fs');
const mcp = require('../services/mcp');

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

async function uploadFileToStorage(buffer, fileName) {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    Body: buffer,
    ContentType: 'audio/wav',
  };

  try {
    const data = await s3.upload(params).promise();
    return data.Location;
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw new Error('Failed to upload file to S3');
  }
}

// Simulate sending file upload details to a recipient using MCP Gateway
async function notifyFileUpload(fileName, fileUrl, recipient) {
  const data = { fileName, fileUrl };
  const { decryptedResponse, isVerified } = await mcp.simulateCommunication(JSON.stringify(data), recipient);

  if (isVerified) {
    console.log('File upload notification sent successfully:', decryptedResponse);
  } else {
    console.error('Failed to verify file upload notification response');
  }
}

module.exports = {
  uploadFileToStorage,
  notifyFileUpload,
};
