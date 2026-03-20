class TalkTrackGenerator {
  constructor(aiModel) {
    this.aiModel = aiModel;
  }

  async generateTalkTrack(callGoal) {
    try {
      const response = await this.aiModel.generateText(callGoal);
      return response.data.talkTrack;
    } catch (error) {
      throw new Error(`Failed to generate talk track: ${error.message}`);
    }
  }
}

module.exports = TalkTrackGenerator;
