const { OpenAI } = require('openai');

class NLP {
  constructor(config) {
    this.openai = new OpenAI({ apiKey: config.openaiApiKey });
  }

  async parsePrompt(prompt) {
    try {
      const response = await this.openai.completions.create({
        engine: 'text-davinci-003',
        prompt: prompt,
        max_tokens: 100,
        n: 1,
        stop: null,
        temperature: 0.7,
      });

      const parsedData = response.choices[0].text.trim();
      return parsedData;
    } catch (error) {
      logger.error('Error parsing prompt', { prompt, error });
      throw error;
    }
  }
}

module.exports = NLP;
