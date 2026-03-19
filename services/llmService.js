const gemini = require('./gemini');
const gpt4 = require('./gpt4');

async function analyzeSentiment(text, provider) {
  if (provider === 'gemini') {
    return await gemini.analyzeSentiment(text);
  } else if (provider === 'gpt4') {
    return await gpt4.analyzeSentiment(text);
  } else {
    throw new Error('Unsupported LLM provider');
  }
}

async function generateEmailContent(prompt, provider) {
  if (provider === 'gpt4') {
    return await gpt4.generateEmailContent(prompt);
  } else {
    throw new Error('Unsupported LLM provider');
  }
}

module.exports = {
  analyzeSentiment,
  generateEmailContent,
};
