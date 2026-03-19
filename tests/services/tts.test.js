const axios = require('axios');
const { generateTTS } = require('../../services/tts');

jest.mock('axios');

describe('TTS Service', () => {
  it('should generate TTS and return audio URL', async () => {
    const mockText = 'Hello, this is a test.';
    const mockAudioUrl = 'https://example.com/audio.mp3';

    axios.post.mockResolvedValue({
      status: 200,
      data: {
        audioUrl: mockAudioUrl,
      },
    });

    const audioUrl = await generateTTS(mockText);
    expect(audioUrl).toBe(mockAudioUrl);
    expect(axios.post).toHaveBeenCalledWith('https://api.tts-provider.com/generate', {
      text: mockText,
      apiKey: process.env.TTS_PROVIDER_API_KEY,
      apiSecret: process.env.TTS_PROVIDER_API_SECRET,
    });
  });

  it('should throw an error if TTS generation fails', async () => {
    const mockText = 'Hello, this is a test.';

    axios.post.mockResolvedValue({
      status: 500,
    });

    await expect(generateTTS(mockText)).rejects.toThrow('TTS generation failed');
    expect(axios.post).toHaveBeenCalledWith('https://api.tts-provider.com/generate', {
      text: mockText,
      apiKey: process.env.TTS_PROVIDER_API_KEY,
      apiSecret: process.env.TTS_PROVIDER_API_SECRET,
    });
  });

  it('should throw an error if the API call fails', async () => {
    const mockText = 'Hello, this is a test.';

    axios.post.mockRejectedValue(new Error('Network error'));

    await expect(generateTTS(mockText)).rejects.toThrow('Failed to generate TTS');
    expect(axios.post).toHaveBeenCalledWith('https://api.tts-provider.com/generate', {
      text: mockText,
      apiKey: process.env.TTS_PROVIDER_API_KEY,
      apiSecret: process.env.TTS_PROVIDER_API_SECRET,
    });
  });
});
