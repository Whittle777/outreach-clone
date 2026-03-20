const axios = require('axios');
const { voiceCallLimiter } = require('./rateLimiter');
const SentimentAnalysisService = require('./sentimentAnalysisService');
const Transcript = require('../models/transcript');
const NLPModule = require('./nlpModule');
const IntentDrivenShortcutsService = require('../services/intentDrivenShortcutsService');
const VoiceAgentDashboard = require('./voiceAgentDashboard');
const ConfidenceScoreRoutingService = require('../services/confidenceScoreRoutingService');
const logger = require('../services/logger');
const KnowledgeGraphService = require('../services/knowledgeGraphService');

class VoiceAgentIntegration {
  constructor(apiKey, apiUrl) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
    this.sentimentAnalysisService = new SentimentAnalysisService();
    this.nlpModule = new NLPModule();
    this.intentDrivenShortcutsService = new IntentDrivenShortcutsService();
    this.dashboard = new VoiceAgentDashboard(apiUrl, apiKey);
    this.confidenceScoreRoutingService = new ConfidenceScoreRoutingService();
    this.knowledgeGraphService = new KnowledgeGraphService(apiKey, apiUrl);
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
      logger.log('AI Decision: Created Call', { prospectId, phoneNumber, script, country });
      return response.data;
    } catch (error) {
      logger.error('AI Decision: Failed to Create Call', { prospectId, phoneNumber, script, country, error: error.message });
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

      logger.log('AI Decision: Detected Hard Bounce', { prospectId, phoneNumber, isHardBounce: response.data.isHardBounce });
      return response.data.isHardBounce;
    } catch (error) {
      logger.error('AI Decision: Failed to Detect Hard Bounce', { prospectId, phoneNumber, error: error.message });
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

      logger.log('AI Decision: Handled Failed State', { prospectId, callId });
      return response.data;
    } catch (error) {
      logger.error('AI Decision: Failed to Handle Failed State', { prospectId, callId, error: error.message });
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
      logger.log('AI Decision: Started Transcription', { callId, transcriptionId, sentimentAnalysisResult });
      return { transcriptionId, sentimentAnalysisResult };
    } catch (error) {
      logger.error('AI Decision: Failed to Start Transcription', { callId, error: error.message });
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

      logger.log('AI Decision: Detected Resistance or Regulatory Edge Cases', { callId, isResistanceOrRegulatoryEdgeCase: response.data.isResistanceOrRegulatoryEdgeCase });
      return response.data.isResistanceOrRegulatoryEdgeCase;
    } catch (error) {
      logger.error('AI Decision: Failed to Detect Resistance or Regulatory Edge Cases', { callId, error: error.message });
      throw new Error(`Failed to detect resistance or regulatory edge cases: ${error.message}`);
    }
  }

  async filterProspectsByNLP(prospects, query) {
    const category = this.nlpModule.classify(query);
    logger.log('AI Decision: Filtered Prospects by NLP', { query, category });
    return prospects.filter(prospect => prospect.category === category);
  }

  async handleIntent(intent, data) {
    const result = await this.intentDrivenShortcutsService.handleIntent(intent, data);
    logger.log('AI Decision: Handled Intent', { intent, data, result });
    return result;
  }

  // Predictive search functionality
  async predictIntent(query) {
    const intents = Object.keys(this.intentDrivenShortcutsService.shortcuts);
    const scores = intents.map(intent => {
      const score = this.nlpModule.calculateSimilarity(intent, query);
      return { intent, score };
    });

    scores.sort((a, b) => b.score - a.score);
    const predictedIntent = scores[0].intent;
    logger.log('AI Decision: Predicted Intent', { query, predictedIntent, scores });
    return predictedIntent;
  }

  async fetchActiveConstraints() {
    try {
      const response = await axios.get(`${this.apiUrl}/constraints/active`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      logger.log('AI Decision: Fetched Active Constraints', { constraints: response.data });
      return response.data;
    } catch (error) {
      logger.error('AI Decision: Failed to Fetch Active Constraints', { error: error.message });
      throw new Error(`Failed to fetch active constraints: ${error.message}`);
    }
  }

  async generateEmail(prospect, tone, intent) {
    const emailData = {
      prospect,
      tone,
      intent,
    };
    const email = await this.intentDrivenShortcutsService.generateEmail(emailData);
    logger.log('AI Decision: Generated Email', { prospect, tone, intent, email });
    return email;
  }

  async generateCallGoal(prospect) {
    const callGoal = await this.intentDrivenShortcutsService.generateCallGoal(prospect);
    logger.log('AI Decision: Generated Call Goal', { prospect, callGoal });
    return callGoal;
  }

  // New methods for AI-generated call goals and talk tracks
  async generateCallGoalAndTalkTrack(prospect) {
    try {
      const callGoal = await this.intentDrivenShortcutsService.generateCallGoal(prospect);
      const talkTrack = await this.intentDrivenShortcutsService.generateTalkTrack(prospect);
      logger.log('AI Decision: Generated Call Goal and Talk Track', { prospect, callGoal, talkTrack });
      return { callGoal, talkTrack };
    } catch (error) {
      logger.error('AI Decision: Failed to Generate Call Goal and Talk Track', { prospect, error: error.message });
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

      logger.log('AI Decision: Fetched Prospect Info', { prospectId, prospectInfo: response.data });
      return response.data;
    } catch (error) {
      logger.error('AI Decision: Failed to Fetch Prospect Info', { prospectId, error: error.message });
      throw new Error(`Failed to fetch prospect information: ${error.message}`);
    }
  }

  // New method to fetch pre-call brief content
  async fetchPreCallBrief(prospectId) {
    try {
      const response = await axios.get(`${this.apiUrl}/prospects/${prospectId}/pre-call-brief`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      logger.log('AI Decision: Fetched Pre-Call Brief', { prospectId, preCallBrief: response.data });
      return response.data;
    } catch (error) {
      logger.error('AI Decision: Failed to Fetch Pre-Call Brief', { prospectId, error: error.message });
      throw new Error(`Failed to fetch pre-call brief for prospect ${prospectId}: ${error.message}`);
    }
  }

  // New method to fetch dashboard data
  async fetchDashboardData() {
    const dashboardData = await this.dashboard.fetchDashboardData();
    logger.log('AI Decision: Fetched Dashboard Data', { dashboardData });
    return dashboardData;
  }

  // New method to fetch call status
  async fetchCallStatus(callId) {
    try {
      const response = await axios.get(`${this.apiUrl}/calls/${callId}/status`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      logger.log('AI Decision: Fetched Call Status', { callId, callStatus: response.data.status });
      return response.data.status;
    } catch (error) {
      logger.error('AI Decision: Failed to Fetch Call Status', { callId, error: error.message });
      throw new Error(`Failed to fetch call status: ${error.message}`);
    }
  }

  // New method to route message based on confidence score
  async routeMessageBasedOnConfidence(confidenceScore) {
    const routingResult = this.confidenceScoreRoutingService.routeMessage(confidenceScore);
    logger.log('AI Decision: Routed Message Based on Confidence', { confidenceScore, routingResult });
    return routingResult;
  }

  // New method to simulate the HITL Workflow
  async simulateHITLWorkflow(prospect) {
    const hitlResult = await this.intentDrivenShortcutsService.simulateHITLWorkflow(prospect);
    logger.log('AI Decision: Simulated HITL Workflow', { prospect, hitlResult });
    return hitlResult;
  }

  // New method to create and visualize knowledge graph
  async createAndVisualizeKnowledgeGraph(prospectId) {
    try {
      const knowledgeGraph = await this.knowledgeGraphService.createKnowledgeGraph(prospectId);
      const visualization = await this.knowledgeGraphService.visualizeKnowledgeGraph(knowledgeGraph.id);
      logger.log('AI Decision: Created and Visualized Knowledge Graph', { prospectId, knowledgeGraphId: knowledgeGraph.id, visualization });
      return { knowledgeGraph, visualization };
    } catch (error) {
      logger.error('AI Decision: Failed to Create and Visualize Knowledge Graph', { prospectId, error: error.message });
      throw new Error(`Failed to create and visualize knowledge graph: ${error.message}`);
    }
  }
}

module.exports = VoiceAgentIntegration;
