// services/ttsService.js

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const doubleWriteStrategy = require('./doubleWriteStrategy');

class TtsService {
  constructor(apiKey, region) {
    this.apiKey = apiKey;
    this.region = region;
    this.apiUrl = `https://${this.region}.tts.speech.microsoft.com/cognitiveservices/v1`;
  }

  async generateTtsAudio(text, voiceName, outputFilePath) {
    try {
      const response = await axios.post(
        this.apiUrl,
        text,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': this.apiKey,
            'Ocp-Apim-Subscription-Region': this.region,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'riff-24khz-16bit-mono-pcm',
            'User-Agent': 'YOUR_RESOURCE_NAME',
          },
          responseType: 'stream',
        }
      );

      const writer = fs.createWriteStream(outputFilePath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    } catch (error) {
      logger.error('TTS audio generation failed:', error);
      throw error;
    }
  }

  async generateAndStoreTtsAudio(text, voiceName, outputFilePath) {
    try {
      await this.generateTtsAudio(text, voiceName, outputFilePath);
      logger.log('TTS audio file generated and stored:', outputFilePath);
      await doubleWriteStrategy.write({ type: 'generateAndStoreTtsAudio', data: { text, voiceName, outputFilePath } });
      return outputFilePath;
    } catch (error) {
      logger.error('Failed to generate and store TTS audio file:', error);
      throw error;
    }
  }
}

module.exports = new TtsService('your-azure-speech-api-key', 'your-region');
