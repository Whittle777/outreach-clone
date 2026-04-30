const { GoogleGenAI } = require('@google/genai');

async function analyzeSentiment(text) {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: `Classify the sentiment of this text as positive, neutral, or negative. Reply with one word only.\n\n${text}` }] }],
  });
  return result.text?.trim().toLowerCase() || 'neutral';
}

module.exports = { analyzeSentiment };
