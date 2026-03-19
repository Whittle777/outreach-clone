const axios = require('axios');

const GEMINI_API_URL = 'https://api.gemini.com/v1/sentiment';

async function analyzeSentiment(text) {
  try {
    const response = await axios.post(GEMINI_API_URL, {
      text: text,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`,
      },
    });
    return response.data.sentiment;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Failed to communicate with Gemini API');
  }
}

module.exports = {
  analyzeSentiment,
};
