const axios = require('axios');

/**
 * Generates Text-to-Speech (TTS) audio for the given text.
 * @param {string} text - The text to be converted to speech.
 * @returns {Promise<string>} - A promise that resolves to the URL of the generated audio file.
 * @throws {Error} - Throws an error if the TTS generation fails.
 */
async function generateTTS(text) {
  const apiKey = process.env.TTS_PROVIDER_API_KEY; // API key for the TTS provider
  const apiSecret = process.env.TTS_PROVIDER_API_SECRET; // API secret for the TTS provider
  const apiUrl = 'https://api.tts-provider.com/generate'; // Replace with the actual API endpoint

  try {
    // Send a POST request to the TTS provider's API with the text, API key, and API secret
    const response = await axios.post(apiUrl, {
      text,
      apiKey,
      apiSecret,
    });

    // Check if the response status is 200 (OK)
    if (response.status === 200) {
      // Return the URL of the generated audio file
      return response.data.audioUrl; // Replace with the actual field name for the audio URL
    } else {
      // Throw an error if the response status is not 200
      throw new Error('TTS generation failed');
    }
  } catch (error) {
    // Log the error to the console
    console.error('Error generating TTS:', error);
    // Throw an error indicating that the TTS generation failed
    throw new Error('Failed to generate TTS');
  }
}

module.exports = {
  generateTTS,
};
