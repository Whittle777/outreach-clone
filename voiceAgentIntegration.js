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
const NaturalLanguageGuardrails = require('../services/naturalLanguageGuardrails');
const SlackIntegrationService = require('../services/slackIntegrationService');
const MicrosoftTeamsIntegrationService = require('../services/microsoftTeamsIntegrationService');

class VoiceAgentIntegration {
  constructor(apiKey, apiUrl, slackWebhookUrl, teamsWebhookUrl) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
    this.slackIntegrationService = new SlackIntegrationService(slackWebhookUrl);
    this.microsoftTeamsIntegrationService = new MicrosoftTeamsIntegrationService(teamsWebhookUrl);
    this.sentimentAnalysisService = new SentimentAnalysisService();
    this.nlpModule = new NLPModule();
    this.intentDrivenShortcutsService = new IntentDrivenShortcutsService();
    this.dashboard = new VoiceAgentDashboard(apiUrl, apiKey);
    this.confidenceScoreRoutingService = new ConfidenceScoreRoutingService();
    this.knowledgeGraphService = new KnowledgeGraphService(apiKey, apiUrl);
    this.naturalLanguageGuardrails = new NaturalLanguageGuardrails();
  }

  async createCall(prospectId, phoneNumber, script, country) {
    try {
      const key = `call:${phoneNumber}`;
      if (await voiceCallLimiter.isRateLimited(key)) {
        throw new Error('Rate limit exceeded');
      }

      this.naturalLanguageGuardrails.enforcePolicyDirectives(script);

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
      this.slackIntegrationService.sendNotification(`AI Decision: Created Call - Prospect ID: ${prospectId}, Phone Number: ${phoneNumber}`);
      this.microsoftTeamsIntegrationService.sendNotification(`AI Decision: Created Call - Prospect ID: ${prospectId}, Phone Number: ${phoneNumber}`);
      return response.data;
    } catch (error) {
      logger.error('AI Decision: Failed to Create Call', { prospectId, phoneNumber, script, country, error: error.message });
      this.slackIntegrationService.sendNotification(`AI Decision: Failed to Create Call - Prospect ID: ${prospectId}, Phone Number: ${phoneNumber}, Error: ${error.message}`);
      this.microsoftTeamsIntegrationService.sendNotification(`AI Decision: Failed to Create Call - Prospect ID: ${prospectId}, Phone Number: ${phoneNumber}, Error: ${error.message}`);
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
      this.slackIntegrationService.sendNotification(`AI Decision: Detected Hard Bounce - Prospect ID: ${prospectId}, Phone Number: ${phoneNumber}, Is Hard Bounce: ${response.data.isHardBounce}`);
      this.microsoftTeamsIntegrationService.sendNotification(`AI Decision: Detected Hard Bounce - Prospect ID: ${prospectId}, Phone Number: ${phoneNumber}, Is Hard Bounce: ${response.data.isHardBounce}`);
      return response.data.isHardBounce;
    } catch (error) {
      logger.error('AI Decision: Failed to Detect Hard Bounce', { prospectId, phoneNumber, error: error.message });
      this.slackIntegrationService.sendNotification(`AI Decision: Failed to Detect Hard Bounce - Prospect ID: ${prospectId}, Phone Number: ${phoneNumber}, Error: ${error.message}`);
      this.microsoftTeamsIntegrationService.sendNotification(`AI Decision: Failed to Detect Hard Bounce - Prospect ID: ${prospectId}, Phone Number: ${phoneNumber}, Error: ${error.message}`);
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
      this.slackIntegrationService.sendNotification(`AI Decision: Handled Failed State - Prospect ID: ${prospectId}, Call ID: ${callId}`);
      this.microsoftTeamsIntegrationService.sendNotification(`AI Decision: Handled Failed State - Prospect ID: ${prospectId}, Call ID: ${callId}`);
      return response.data;
    } catch (error) {
      logger.error('AI Decision: Failed to Handle Failed State', { prospectId, callId, error: error.message });
      this.slackIntegrationService.sendNotification(`AI Decision: Failed to Handle Failed State - Prospect ID: ${prospectId}, Call ID: ${callId}, Error: ${error.message}`);
      this.microsoftTeamsIntegrationService.sendNotification(`AI Decision: Failed to Handle Failed State - Prospect ID: ${prospectId}, Call ID: ${callId}, Error: ${error.message}`);
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
      this.slackIntegrationService.sendNotification(`AI Decision: Started Transcription - Call ID: ${callId}, Transcription ID: ${transcriptionId}`);
      this.microsoftTeamsIntegrationService.sendNotification(`AI Decision: Started Transcription - Call ID: ${callId}, Transcription ID: ${transcriptionId}`);
      return { transcriptionId, sentimentAnalysisResult };
    } catch (error) {
      logger.error('AI Decision: Failed to Start Transcription', { callId, error: error.message });
      this.slackIntegrationService.sendNotification(`AI Decision: Failed to Start Transcription - Call ID: ${callId}, Error: ${error.message}`);
      this.microsoftTeamsIntegrationService.sendNotification(`AI Decision: Failed to Start Transcription - Call ID: ${callId}, Error: ${error.message}`);
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
      this.slackIntegrationService.sendNotification(`AI Decision: Detected Resistance or Regulatory Edge Cases - Call ID: ${callId}, Is Resistance or Regulatory Edge Case: ${response.data.isResistanceOrRegulatoryEdgeCase}`);
      this.microsoftTeamsIntegrationService.sendNotification(`AI Decision: Detected Resistance or Regulatory Edge Cases - Call ID: ${callId}, Is Resistance or Regulatory Edge Case: ${response.data.isResistanceOrRegulatoryEdgeCase}`);
      return response.data.isResistanceOrRegulatoryEdgeCase;
    } catch (error) {
      logger.error('AI Decision: Failed to Detect Resistance or Regulatory Edge Cases', { callId, error: error.message });
      this.slackIntegrationService.sendNotification(`AI Decision: Failed to Detect Resistance or Regulatory Edge Cases - Call ID: ${callId}, Error: ${error.message}`);
      this.microsoftTeamsIntegrationService.sendNotification(`AI Decision: Failed to Detect Resistance or Regulatory Edge Cases - Call ID: ${callId}, Error: ${error.message}`);
      throw new Error(`Failed to detect resistance or regulatory edge cases: ${error.message}`);
    }
  }

  async filterProspectsByNLP(prospects, query) {
    const category = this.nlpModule.classify(query);
    logger.log('AI Decision: Filtered Prospects by NLP', { query, category });
    this.slackIntegrationService.sendNotification(`AI Decision: Filtered Prospects by NLP - Query: ${query}, Category: ${category}`);
    this.microsoftTeamsIntegrationService.sendNotification(`AI Decision: Filtered Prospects by NLP - Query: ${query}, Category: ${category}`);
    return prospects.filter(prospect => prospect.category === category);
  }

  async handleIntent(intent, data) {
    const result = await this.intentDrivenShortcutsService.handleIntent(intent, data);
    logger.log('AI Decision: Handled Intent', { intent, data, result });
    this.slackIntegrationService.sendNotification(`AI Decision: Handled Intent - Intent: ${intent}, Data: ${JSON.stringify(data)}, Result: ${JSON.stringify(result)}`);
    this.microsoftTeamsIntegrationService.sendNotification(`AI Decision: Handled Intent - Intent: ${intent}, Data: ${JSON.stringify(data)}, Result: ${JSON.stringify(result)}`);
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
    this.slackIntegrationService.sendNotification(`AI Decision: Predicted Intent - Query: ${query}, Predicted Intent: ${predictedIntent}, Scores: ${JSON.stringify(scores)}`);
    this.microsoftTeamsIntegrationService.sendNotification(`AI Decision: Predicted Intent - Query: ${query}, Predicted Intent: ${predictedIntent}, Scores: ${JSON.stringify(scores)}`);
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
      this.slackIntegrationService.sendNotification(`AI Decision: Fetched Active Constraints - Constraints: ${JSON.stringify(response.data)}`);
      this.microsoftTeamsIntegrationService.sendNotification(`AI Decision: Fetched Active Constraints - Constraints: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error) {
      logger.error('AI Decision: Failed to Fetch Active Constraints', { error: error.message });
      this.slackIntegrationService.sendNotification(`AI Decision: Failed to Fetch Active Constraints - Error: ${error.message}`);
      this.microsoftTeamsIntegrationService.sendNotification(`AI Decision: Failed to Fetch Active Constraints - Error: ${error.message}`);
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
    this.slackIntegrationService.sendNotification(`AI Decision: Generated Email - Prospect: ${JSON.stringify(prospect)}, Tone: ${tone}, Intent: ${intent}, Email: ${email}`);
    this.microsoftTeamsIntegrationService.sendNotification(`AI Decision: Generated Email - Prospect: ${JSON.stringify(prospect)}, Tone: ${tone}, Intent: ${intent}, Email: ${email}`);
    return email;
  }

  async generateCallGoal(prospect) {
    const callGoal = await this.intentDrivenShortcutsService.generateCallGoal(prospect);
    logger.log('AI Decision: Generated Call Goal', { prospect, callGoal });
    this.slackIntegrationService.sendNotification(`AI Decision: Generated Call Goal - Prospect: ${JSON.stringify(prospect)}, Call Goal: ${callGoal}`);
    this.microsoftTeamsIntegrationService.sendNotification(`AI Decision: Generated Call Goal - Prospect: ${JSON.stringify(prospect)}, Call Goal: ${callGoal}`);
    return callGoal;
  }

  // New methods for AI-generated call goals and talk tracks
  async generateCallGoalAndTalkTrack(prospect) {
    try {
      const callGoal = await this.intentDrivenShortcutsService.generateCallGoal(prospect);
      const talkTrack = await this.intentDrivenShortcutsService.generateTalkTrack(prospect);
      logger.log('AI Decision: Generated Call Goal and Talk Track', { prospect, callGoal, talkTrack });
      this.slackIntegrationService.sendNotification(`AI Decision: Generated Call Goal and Talk Track - Prospect: ${JSON.stringify(prospect)}, Call Goal: ${callGoal}, Talk Track: ${talkTrack}`);
      this.microsoftTeamsIntegrationService.sendNotification(`AI Decision: Generated Call Goal and Talk Track - Prospect: ${JSON.stringify(prospect)}, Call Goal: ${callGoal}, Talk Track: ${talkTrack}`);
      return { callGoal, talkTrack };
    } catch (error) {
      logger.error('AI Decision: Failed to Generate Call Goal and Talk Track', { prospect, error: error.message });
      this.slackIntegrationService.sendNotification(`AI Decision: Failed to Generate Call Goal and Talk Track - Prospect: ${JSON.stringify(prospect)}, Error: ${error.message}`);
      this.microsoftTeamsIntegrationService.sendNotification(`AI Decision: Failed to Generate Call Goal and Talk Track - Prospect: ${JSON.stringify(prospect)}, Error: ${error.message}`);
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
      this.slackIntegrationService.sendNotification(`AI Decision: Fetched Prospect Info - Prospect ID: ${prospectId}, Prospect Info: ${JSON.stringify(response.data)}`);
      this.microsoftTeamsIntegrationService.sendNotification(`AI Decision: Fetched Prospect Info - Prospect ID: ${prospectId}, Prospect Info: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error) {
      logger.error('AI Decision: Failed to Fetch Prospect Info', { prospectId, error: error.message });
      this.slackIntegrationService.sendNotification(`AI Decision: Failed to Fetch Prospect Info - Prospect ID: ${prospectId}, Error: ${error.message}`);
      this.microsoftTeamsIntegrationService.sendNotification(`AI Decision: Failed to Fetch Prospect Info - Prospect ID: ${prospectId}, Error: ${error.message}`);
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
      this.slackIntegrationService.sendNotification(`AI Decision: Fetched Pre-Call Brief - Prospect ID: ${prospectId}, Pre-Call Brief: ${JSON.stringify(response.data)}`);
      this.microsoftTeamsIntegrationService.sendNotification(`AI Decision: Fetched Pre-Call Brief - Prospect ID: ${prospectId}, Pre-Call Brief: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error) {
      logger.error('AI Decision: Failed to Fetch Pre-Call Brief', { prospectId, error: error.message });
      this.slackIntegrationService.sendNotification(`AI Decision: Failed to Fetch Pre-Call Brief - Prospect ID: ${prospectId}, Error: ${error.message}`);
      this.microsoftTeamsIntegrationService.sendNotification(`AI Decision: Failed to Fetch Pre-Call Brief - Prospect ID: ${prospectId}, Error: ${error.message}`);
      throw new Error(`Failed to fetch pre-call brief for prospect ${prospectId}: ${error.message}`);
    }
  }

  // New method to fetch dashboard data
  async fetchDashboardData() {
    const dashboardData = await this.dashboard.fetchDashboardData();
    logger.log('AI Decision: Fetched Dashboard Data', { dashboardData });
    this.slackIntegrationService.sendNotification(`AI Decision: Fetched Dashboard Data - Dashboard Data: ${JSON.stringify(dashboardData)}`);
    this.microsoftTeamsIntegrationService.sendNotification(`AI Decision: Fetched Dashboard Data - Dashboard Data: ${JSON.stringify(dashboardData)}`);
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
      this.slackIntegrationService.sendNotification(`AI Decision: Fetched Call Status - Call ID: ${callId}, Call Status: ${response.data.status}`);
      this.microsoftTeamsIntegrationService.sendNotification(`AI Decision: Fetched Call Status - Call ID: ${callId}, Call Status: ${response.data.status}`);
      return response.data.status;
    } catch (error) {
      logger.error('AI Decision: Failed to Fetch Call Status', { callId, error: error.message });
      this.slackIntegrationService.sendNotification(`AI Decision: Failed to Fetch Call Status - Call ID: ${callId}, Error: ${error.message}`);
      this.microsoftTeamsIntegrationService.sendNotification(`AI Decision: Failed to Fetch Call Status - Call ID: ${callId}, Error: ${error.message}`);
      throw new Error(`Failed to fetch call status: ${error.message}`);
    }
  }

  // New method to route message based on confidence score
  async routeMessageBasedOnConfidence(confidenceScore) {
    const routingResult = this.confidenceScoreRoutingService.routeMessage(confidenceScore);
    logger.log('AI Decision: Routed Message Based on Confidence', { confidenceScore, routingResult });
    this.slackIntegrationService.sendNotification(`AI Decision: Routed Message Based on Confidence - Confidence Score: ${confidenceScore}, Routing Result: ${JSON.stringify(routingResult)}`);
    this.microsoftTeamsIntegrationService.sendNotification(`AI Decision: Routed Message Based on Confidence - Confidence Score: ${confidenceScore}, Routing Result: ${JSON.stringify(routingResult)}`);
    return routingResult;
  }

  // New method to simulate the HITL Workflow
  async simulateHITLWorkflow(prospect) {
    const hitlResult = await this.intentDrivenShortcutsService.simulateHITLWorkflow(prospect);
    logger.log('AI Decision: Simulated HITL Workflow', { prospect, hitlResult });
    this.slackIntegrationService.sendNotification(`AI Decision: Simulated HITL Workflow - Prospect: ${JSON.stringify(prospect)}, HITL Result: ${JSON.stringify(hitlResult)}`);
    this.microsoftTeamsIntegrationService.sendNotification(`AI Decision: Simulated HITL Workflow - Prospect: ${JSON.stringify(prospect)}, HITL Result: ${JSON.stringify(hitlResult)}`);
    return hitlResult;
  }

  // New method to create and visualize knowledge graph
  async createAndVisualizeKnowledgeGraph(prospectId) {
    try {
      const knowledgeGraph = await this.knowledgeGraphService.createKnowledgeGraph(prospectId);
      const visualization = await this.knowledgeGraphService.visualizeKnowledgeGraph(knowledgeGraph.id);
      logger.log('AI Decision: Created and Visualized Knowledge Graph', { prospectId, knowledgeGraphId: knowledgeGraph.id, visualization });
      this.slackIntegrationService.sendNotification(`AI Decision: Created and Visualized Knowledge Graph - Prospect ID: ${prospectId}, Knowledge Graph ID: ${knowledgeGraph.id}, Visualization: ${JSON.stringify(visualization)}`);
      this.microsoftTeamsIntegrationService.sendNotification(`AI Decision: Created and Visualized Knowledge Graph - Prospect ID: ${prospectId}, Knowledge Graph ID: ${knowledgeGraph.id}, Visualization: ${JSON.stringify(visualization)}`);
      return { knowledgeGraph, visualization };
    } catch (error) {
      logger.error('AI Decision: Failed to Create and Visualize Knowledge Graph', { prospectId, error: error.message });
      this.slackIntegrationService.sendNotification(`AI Decision: Failed to Create and Visualize Knowledge Graph - Prospect ID: ${prospectId}, Error: ${error.message}`);
      this.microsoftTeamsIntegrationService.sendNotification(`AI Decision: Failed to Create and Visualize Knowledge Graph - Prospect ID: ${prospectId}, Error: ${error.message}`);
      throw new Error(`Failed to create and visualize knowledge graph: ${error.message}`);
    }
  }
}

module.exports = VoiceAgentIntegration;
