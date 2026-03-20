class TranscriptService {
  constructor() {
    this.transcripts = new Map();
  }

  async getTranscript(transcriptionId) {
    if (!this.transcripts.has(transcriptionId)) {
      throw new Error('Transcript not found');
    }
    return this.transcripts.get(transcriptionId);
  }

  async addTranscript(transcriptionId, transcript) {
    this.transcripts.set(transcriptionId, transcript);
  }
}

module.exports = new TranscriptService();
