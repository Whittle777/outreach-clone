const axios = require('axios');

const GPT4_API_URL = 'https://api.openai.com/v1/engines/davinci-codex/completions';
const GPT4_API_KEY = 'your-gpt4-api-key'; // Replace with your actual GPT-4 API key

async function generateEmailContent(prompt) {
  try {
    const response = await axios.post(GPT4_API_URL, {
      prompt: prompt,
      max_tokens: 150,
      n: 1,
      stop: null,
      temperature: 0.7,
    }, {
      headers: {
        'Authorization': `Bearer ${GPT4_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error('Error generating email content with GPT-4:', error);
    throw new Error('Failed to generate email content');
  }
}

module.exports = { generateEmailContent };
