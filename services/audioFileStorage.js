const { BlobServiceClient } = require('@azure/storage-blob');
const path = require('path');

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = 'audio-files';

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient(containerName);

async function uploadAudioFile(fileName, filePath) {
  const blockBlobClient = containerClient.getBlockBlobClient(fileName);
  await blockBlobClient.uploadFile(filePath);
  return blockBlobClient.url;
}

async function getAudioFileUrl(fileName) {
  const blockBlobClient = containerClient.getBlockBlobClient(fileName);
  return blockBlobClient.url;
}

module.exports = {
  uploadAudioFile,
  getAudioFileUrl,
};
