const { SpeechServiceClient } = require('@azure/cognitiveservices-speech');

class AzureSpeechService {
  constructor(apiKey, region) {
    this.apiKey = apiKey;
    this.region = region;
  }

  async startTranscription(audioFilePath) {
    const speechConfig = SpeechServiceClient.createSpeechConfigFromSubscription(this.apiKey, this.region);
    const audioConfig = SpeechServiceClient.createAudioConfigFromWavFileInput(audioFilePath);

    const recognizer = new SpeechServiceClient.createSpeechRecognizer(speechConfig, audioConfig);

    return new Promise((resolve, reject) => {
      recognizer.recognizeOnceAsync(
        (result) => {
          if (result.reason === SpeechServiceClient.ResultReason.RecognizedSpeech) {
            resolve(result.text);
          } else {
            reject(new Error(`Error: ${result.errorDetails}`));
          }
        },
        (err) => {
          reject(err);
        }
      );
    });
  }
}

module.exports = AzureSpeechService;
