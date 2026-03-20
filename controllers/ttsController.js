// controllers/ttsController.js

const TtsService = require('../services/ttsService');
const logger = require('../services/logger');

class TtsController {
  async generateTtsAudio(req, res) {
    try {
      const { text, voiceId, outputFilePath } = req.body;
      const filePath = await TtsService.generateAndStoreTtsAudio(text, voiceId, outputFilePath);
      res.status(200).json({ filePath });
    } catch (error) {
      logger.error('Error generating TTS audio:', error);
      res.status(500).json({ error: 'Failed to generate TTS audio' });
    }
  }
}

module.exports = new TtsController();
