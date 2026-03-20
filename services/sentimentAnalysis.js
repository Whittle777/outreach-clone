const axios = require('axios');
const config = require('../services/config').getConfig();

class SentimentAnalysis {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.apiUrl = 'https://api.openai.com/v1/engines/davinci-codex/completions';
  }

  async analyze(text) {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          prompt: `Analyze the sentiment of the following text: "${text}". Return a JSON object with the sentiment score and label.`,
          max_tokens: 50,
          n: 1,
          stop: null,
          temperature: 0.5,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      const result = JSON.parse(response.data.choices[0].text.trim());
      return result;
    } catch (error) {
      throw new Error(`Error analyzing sentiment: ${error.message}`);
    }
  }
}

module.exports = SentimentAnalysis;
