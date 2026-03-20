const { uploadAudioFile, getAudioFileUrl, deleteAudioFile } = require('../services/audioFileStorage');
const fs = require('fs');
const path = require('path');
const sinon = require('sinon');
const AWS = require('aws-sdk');

describe('Audio File Storage Service', () => {
  let sandbox;
  let s3Stub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    s3Stub = sandbox.stub(AWS.S3.prototype, 'upload');
    sandbox.stub(AWS.S3.prototype, 'headObject');
    sandbox.stub(AWS.S3.prototype, 'deleteObject');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('uploadAudioFile', () => {
    it('should upload an audio file and return the file URL', async () => {
      const fileName = 'test.mp3';
      const filePath = path.join(__dirname, 'test.mp3');
      const fileContent = 'dummy audio content';
      fs.writeFileSync(filePath, fileContent);

      const uploadResult = {
        Location: 'https://example.com/test.mp3',
      };
      s3Stub.resolves(uploadResult);

      const result = await uploadAudioFile(fileName, filePath);
      expect(result).to.equal(uploadResult.Location);

      fs.unlinkSync(filePath);
    });

    it('should throw an error if upload fails', async () => {
      const fileName = 'test.mp3';
      const filePath = path.join(__dirname, 'test.mp3');
      const fileContent = 'dummy audio content';
      fs.writeFileSync(filePath, fileContent);

      const error = new Error('Upload failed');
      s3Stub.rejects(error);

      try {
        await uploadAudioFile(fileName, filePath);
      } catch (err) {
        expect(err).to.equal(error);
      }

      fs.unlinkSync(filePath);
    });
  });

  describe('getAudioFileUrl', () => {
    it('should return the correct audio file URL', async () => {
      const fileName = 'test.mp3';
      const expectedUrl = 'https://example.com/test.mp3';

      const headResult = {
        Metadata: {},
      };
      s3Stub.resolves(headResult);

      const result = await getAudioFileUrl(fileName);
      expect(result).to.equal(expectedUrl);
    });

    it('should throw an error if headObject fails', async () => {
      const fileName = 'test.mp3';

      const error = new Error('HeadObject failed');
      s3Stub.rejects(error);

      try {
        await getAudioFileUrl(fileName);
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe('deleteAudioFile', () => {
    it('should delete an audio file successfully', async () => {
      const fileName = 'test.mp3';

      s3Stub.resolves();

      await deleteAudioFile(fileName);
      expect(s3Stub.calledOnceWithExactly({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: fileName })).to.be.true;
    });

    it('should throw an error if deleteObject fails', async () => {
      const fileName = 'test.mp3';

      const error = new Error('DeleteObject failed');
      s3Stub.rejects(error);

      try {
        await deleteAudioFile(fileName);
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });
});
