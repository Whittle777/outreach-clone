const axios = require('axios');
const { voiceCallLimiter } = require('./rateLimiter');
const SentimentAnalysisService = require('./sentimentAnalysisService');
const Transcript = require('../models/transcript');
const NLPModule = require('./nlpModule');
const IntentDrivenShortcutsService = require('../services/intentDrivenShortcutsService');

class VoiceAgentIntegration {
  constructor(apiKey, apiUrl) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
    this.sentimentAnalysisService = new SentimentAnalysisService();
    this.nlpModule = new NLPModule();
    this.intentDrivenShortcutsService = new IntentDrivenShortcutsService();
  }

  async createCall(prospectId, phoneNumber, script, country) {
    try {
      const key = `call:${phoneNumber}`;
      if (await voiceCallLimiter.isRateLimited(key)) {
        throw new Error('Rate limit exceeded');
      }

      const response = await axios.post(`${this.apiUrl}/calls`, {
        prospectId,
        phoneNumber,
        script,
        country,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      await voiceCallLimiter.incrementRequestCount(key);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create call: ${error.message}`);
    }
  }

  async detectHardBounce(prospectId, phoneNumber) {
    try {
      const response = await axios.get(`${this.apiUrl}/bounce-detection`, {
        params: {
          prospectId,
          phoneNumber,
        },
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data.isHardBounce;
    } catch (error) {
      throw new Error(`Failed to detect hard bounce: ${error.message}`);
    }
  }

  async handleFailedState(prospectId, callId) {
    try {
      const response = await axios.post(`${this.apiUrl}/calls/${callId}/fail`, {
        prospectId,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to handle failed state: ${error.message}`);
    }
  }

  async startTranscription(callId) {
    try {
      const response = await axios.post(`${this.apiUrl}/calls/${callId}/transcription/start`, {
        callId,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const transcriptionId = response.data.transcriptionId;
      const sentimentAnalysisResult = await this.sentimentAnalysisService.analyze(transcriptionId);
      const transcriptData = {
        callId,
        transcriptionId,
        sentimentAnalysisResult,
      };

      await Transcript.create(transcriptData);
      return { transcriptionId, sentimentAnalysisResult };
    } catch (error) {
      throw new Error(`Failed to start transcription: ${error.message}`);
    }
  }

  async detectResistanceOrRegulatoryEdgeCases(callId) {
    try {
      const response = await axios.get(`${this.apiUrl}/calls/${callId}/resistance-detection`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data.isResistanceOrRegulatoryEdgeCase;
    } catch (error) {
      throw new Error(`Failed to detect resistance or regulatory edge cases: ${error.message}`);
    }
  }

  async filterProspectsByNLP(prospects, query) {
    const category = this.nlpModule.classify(query);
    return prospects.filter(prospect => prospect.category === category);
  }

  async handleIntent(intent, data) {
    return await this.intentDrivenShortcutsService.handleIntent(intent, data);
  }

  // Predictive search functionality
  async predictIntent(query) {
    const intents = Object.keys(this.intentDrivenShortcutsService.shortcuts);
    const scores = intents.map(intent => {
      const score = this.nlpModule.calculateSimilarity(intent, query);
      return { intent, score };
    });

    scores.sort((a, b) => b.score - a.score);
    return scores[0].intent;
  }

  async fetchActiveConstraints() {
    try {
      const response = await axios.get(`${this.apiUrl}/constraints/active`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch active constraints: ${error.message}`);
    }
  }

  async generateEmail(prospect, tone, intent) {
    const emailData = {
      prospect,
      tone,
      intent,
    };
    return await this.intentDrivenShortcutsService.generateEmail(emailData);
  }

  async generateCallGoal(prospect) {
    return await this.intentDrivenShortcutsService.generateCallGoal(prospect);
  }

  // New methods for AI-generated call goals and talk tracks
  async generateCallGoalAndTalkTrack(prospect) {
    try {
      const callGoal = await this.intentDrivenShortcutsService.generateCallGoal(prospect);
      const talkTrack = await this.intentDrivenShortcutsService.generateTalkTrack(prospect);
      return { callGoal, talkTrack };
    } catch (error) {
      throw new Error(`Failed to generate call goal and talk track: ${error.message}`);
    }
  }

  // New method to fetch prospect information
  async fetchProspectInfo(prospectId) {
    try {
      const response = await axios.get(`${this.apiUrl}/prospects/${prospectId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch prospect information: ${error.message}`);
    }
  }
}

module.exports = VoiceAgentIntegration;
