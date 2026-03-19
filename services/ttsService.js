// services/ttsService.js

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class TtsService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.apiUrl = 'https://api.elevenlabs.io/v1/text-to-speech';
  }

  async generateTtsAudio(text, voiceId, outputFilePath) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${voiceId}`,
        {
          text: text,
          voice_settings: {
            stability: 0.75,
            similarity_boost: 0.75,
          },
        },
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
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

  async generateAndStoreTtsAudio(text, voiceId, outputFilePath) {
    try {
      await this.generateTtsAudio(text, voiceId, outputFilePath);
      logger.log('TTS audio file generated and stored:', outputFilePath);
      return outputFilePath;
    } catch (error) {
      logger.error('Failed to generate and store TTS audio file:', error);
      throw error;
    }
  }
}

module.exports = TtsService;
