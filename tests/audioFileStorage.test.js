const { uploadAudioFile, getAudioFileUrl, deleteAudioFile } = require('../services/audioFileStorage');
const AWS = require('aws-sdk');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');
const logger = require('../services/logger');
const temporalStateManager = require('../services/temporalStateManager');
const slackIntegration = require('../services/slackIntegration');

describe('Audio File Storage', () => {
  let s3;
  let uploadStub;
  let headStub;
  let deleteStub;
  let fsReadFileSyncStub;

  beforeEach(() => {
    s3 = new AWS.S3();
    uploadStub = sinon.stub(s3, 'upload').returnsThis();
    headStub = sinon.stub(s3, 'headObject').returnsThis();
    deleteStub = sinon.stub(s3, 'deleteObject').returnsThis();
    fsReadFileSyncStub = sinon.stub(fs, 'readFileSync').returns('file content');
  });

  afterEach(() => {
    uploadStub.restore();
    headStub.restore();
    deleteStub.restore();
    fsReadFileSyncStub.restore();
  });

  describe('uploadAudioFile', () => {
    it('should upload an audio file and return the location', async () => {
      const fileName = 'test.mp3';
      const filePath = path.join(__dirname, 'test.mp3');
      const uploadResult = {
        Key: fileName,
        Location: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${fileName}`,
      };

      uploadStub.resolves({ promise: () => Promise.resolve(uploadResult) });

      const location = await uploadAudioFile(fileName, filePath);

      expect(location).to.equal(uploadResult.Location);
      expect(uploadStub.calledOnceWithExactly({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: fileName,
        Body: 'file content',
        ContentType: 'audio/mpeg',
      })).to.be.true;
    });

    it('should log an error if upload fails', async () => {
      const fileName = 'test.mp3';
      const filePath = path.join(__dirname, 'test.mp3');
      const error = new Error('Upload failed');

      uploadStub.resolves({ promise: () => Promise.reject(error) });

      try {
        await uploadAudioFile(fileName, filePath);
      } catch (e) {
        expect(e).to.equal(error);
      }

      expect(logger.error.calledOnceWithExactly('Failed to upload audio file', { error, fileName })).to.be.true;
    });
  });

  describe('getAudioFileUrl', () => {
    it('should return the audio file URL', async () => {
      const fileName = 'test.mp3';
      const headResult = {
        ContentType: 'audio/mpeg',
      };

      headStub.resolves({ promise: () => Promise.resolve(headResult) });

      const url = await getAudioFileUrl(fileName);

      expect(url).to.equal(`https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${fileName}`);
      expect(headStub.calledOnceWithExactly({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: fileName,
      })).to.be.true;
    });

    it('should log an error if getting the file URL fails', async () => {
      const fileName = 'test.mp3';
      const error = new Error('Failed to get file URL');

      headStub.resolves({ promise: () => Promise.reject(error) });

      try {
        await getAudioFileUrl(fileName);
      } catch (e) {
        expect(e).to.equal(error);
      }

      expect(logger.error.calledOnceWithExactly('Failed to get audio file URL', { error, fileName })).to.be.true;
    });
  });

  describe('deleteAudioFile', () => {
    it('should delete an audio file', async () => {
      const fileName = 'test.mp3';

      deleteStub.resolves({ promise: () => Promise.resolve() });

      await deleteAudioFile(fileName);

      expect(deleteStub.calledOnceWithExactly({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: fileName,
      })).to.be.true;
      expect(logger.info.calledOnceWithExactly('Audio file deleted', { fileName })).to.be.true;
    });

    it('should log an error if deletion fails', async () => {
      const fileName = 'test.mp3';
      const error = new Error('Failed to delete file');

      deleteStub.resolves({ promise: () => Promise.reject(error) });

      try {
        await deleteAudioFile(fileName);
      } catch (e) {
        expect(e).to.equal(error);
      }

      expect(logger.error.calledOnceWithExactly('Failed to delete audio file', { error, fileName })).to.be.true;
    });
  });
});
