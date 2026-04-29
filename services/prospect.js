const axios = require('axios');
const config = require("../config/index").getConfig();
const SentimentAnalysis = require('../services/sentimentAnalysis');
const logger = require('../services/logger');

class Prospect {
  constructor(apiKey) {
    this.sentimentAnalysis = new SentimentAnalysis(apiKey);
  }

  static async create(prospectData) {
    const prospect = await prisma.prospect.create({
      data: prospectData,
    });

    await this.analyzeSentiment(prospect.id, prospectData.description);

    return prospect;
  }

  static async update(id, prospectData) {
    const prospect = await prisma.prospect.update({
      where: { id: parseInt(id) },
      data: prospectData,
    });

    await this.analyzeSentiment(id, prospectData.description);

    // Emit WebSocket event for prospect update
    logger.prospectUpdated(prospectData);

    return prospect;
  }

  static async analyzeSentiment(id, description) {
    try {
      const sentimentResult = await this.sentimentAnalysis.analyze(description);
      await this.storeSentimentResult(id, sentimentResult);
    } catch (error) {
      logger.error('Error analyzing sentiment', error);
    }
  }

  static async storeSentimentResult(id, sentimentResult) {
    const knowledgeGraph = new KnowledgeGraph();
    await knowledgeGraph.write({
      prospectId: id,
      sentimentResult: sentimentResult,
    });
  }

  static async findById(id) {
    return await prisma.prospect.findUnique({
      where: { id: parseInt(id) },
    });
  }

  static async delete(id) {
    return await prisma.prospect.delete({
      where: { id: parseInt(id) },
    });
  }
}

module.exports = Prospect;
