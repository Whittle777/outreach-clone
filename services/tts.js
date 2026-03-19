const axios = require('axios');

async function generateTTS(text) {
  const apiKey = process.env.TTS_PROVIDER_API_KEY;
  const apiSecret = process.env.TTS_PROVIDER_API_SECRET;
  const apiUrl = 'https://api.tts-provider.com/generate'; // Replace with the actual API endpoint

  try {
    const response = await axios.post(apiUrl, {
      text,
      apiKey,
      apiSecret,
    });

    if (response.status === 200) {
      return response.data.audioUrl; // Replace with the actual field name for the audio URL
    } else {
      throw new Error('TTS generation failed');
    }
  } catch (error) {
    console.error('Error generating TTS:', error);
    throw new Error('Failed to generate TTS');
  }
}

module.exports = {
  generateTTS,
};
