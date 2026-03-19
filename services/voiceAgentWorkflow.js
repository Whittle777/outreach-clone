const { AudioFile } = require('../models/AudioFile');
const { generateTTS } = require('../services/tts');
const { uploadFileToStorage } = require('../services/storage'); // Assuming a storage service is available

class VoiceAgentWorkflow {
  static async generateAndStoreAudioFile(prospectId, script) {
    try {
      // Generate TTS audio file
      const audioBuffer = await generateTTS(script);

      // Create metadata for the audio file
      const metadata = {
        prospectId,
        script,
      };

      // Create an entry in the database
      const audioFile = await AudioFile.create({
        name: `audio-${prospectId}-${Date.now()}.wav`,
        type: 'audio/wav',
        size: audioBuffer.length,
        metadata,
      });

      // Upload the audio file to storage
      const fileUrl = await uploadFileToStorage(audioBuffer, audioFile.id);

      // Update the database with the file URL
      await AudioFile.updateFileUrl(audioFile.id, fileUrl);

      return audioFile;
    } catch (error) {
      console.error('Error generating and storing audio file:', error);
      throw new Error('Failed to generate and store audio file');
    }
  }

  static async getAudioFileById(id) {
    try {
      const audioFile = await AudioFile.findById(id);
      if (!audioFile) {
        throw new Error('Audio file not found');
      }
      return audioFile;
    } catch (error) {
      console.error('Error retrieving audio file:', error);
      throw new Error('Failed to retrieve audio file');
    }
  }
}

module.exports = VoiceAgentWorkflow;
