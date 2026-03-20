const axios = require('axios');
const logger = require('../services/logger');
const AzureAcs = require('../messageBroker/azureAcs');
const doubleWriteStrategy = require('../services/doubleWriteStrategy');

const azureAcsUrl = process.env.AZURE_ACS_URL || 'https://your-azure-acs-url.com';
const azureAcsKey = process.env.AZURE_ACS_KEY || 'your-azure-acs-key';

const createCall = async (prospectId, bento, teamsResourceAccountObjectId) => {
  try {
    const azureAcs = new AzureAcs({
      connectionString: azureAcsUrl,
      accessToken: azureAcsKey
    });

    const response = await azureAcs.createCall(prospectId, 'US', teamsResourceAccountObjectId);
    await doubleWriteStrategy.write({ type: 'createCall', data: response.data });
    return response.data;
  } catch (error) {
    logger.error(`Error creating call for prospect ${prospectId}: ${error.message}`);
    throw error;
  }
};

const handleVoicemailDrop = async (callId, bento) => {
  try {
    const response = await axios.post(`${azureAcsUrl}/calls/${callId}/voicemail`, {
      bento,
    }, {
      headers: {
        'Ocp-Apim-Subscription-Key': azureAcsKey,
      },
    });
    await doubleWriteStrategy.write({ type: 'handleVoicemailDrop', data: response.data });
    return response.data;
  } catch (error) {
    logger.error(`Error handling voicemail drop for call ${callId}: ${error.message}`);
    throw error;
  }
};

const getTranscriptionResult = async (transcriptionId) => {
  try {
    const response = await axios.get(`${azureAcsUrl}/transcriptions/${transcriptionId}`, {
      headers: {
        'Ocp-Apim-Subscription-Key': azureAcsKey,
      },
    });
    await doubleWriteStrategy.write({ type: 'getTranscriptionResult', data: response.data });
    return response.data;
  } catch (error) {
    logger.error(`Error getting transcription result for transcription ${transcriptionId}: ${error.message}`);
    throw error;
  }
};

const detectResistanceOrRegulatoryEdgeCases = async (callId) => {
  try {
    const response = await axios.get(`${azureAcsUrl}/calls/${callId}/resistance-detection`, {
      headers: {
        'Ocp-Apim-Subscription-Key': azureAcsKey,
      },
    });
    await doubleWriteStrategy.write({ type: 'detectResistanceOrRegulatoryEdgeCases', data: response.data });
    return response.data.isResistanceOrRegulatoryEdgeCase;
  } catch (error) {
    logger.error(`Error detecting resistance or regulatory edge cases for call ${callId}: ${error.message}`);
    throw error;
  }
};

const updateCallFlags = async (callId, flags) => {
  try {
    const response = await axios.put(`${azureAcsUrl}/calls/${callId}/flags`, {
      flags,
    }, {
      headers: {
        'Ocp-Apim-Subscription-Key': azureAcsKey,
      },
    });
    await doubleWriteStrategy.write({ type: 'updateCallFlags', data: response.data });
    return response.data;
  } catch (error) {
    logger.error(`Error updating call flags for call ${callId}: ${error.message}`);
    throw error;
  }
};

const getCallFlags = async (callId) => {
  try {
    const response = await axios.get(`${azureAcsUrl}/calls/${callId}/flags`, {
      headers: {
        'Ocp-Apim-Subscription-Key': azureAcsKey,
      },
    });
    await doubleWriteStrategy.write({ type: 'getCallFlags', data: response.data });
    return response.data;
  } catch (error) {
    logger.error(`Error getting call flags for call ${callId}: ${error.message}`);
    throw error;
  }
};

const fetchActiveConstraints = async () => {
  try {
    const azureAcs = new AzureAcs({
      connectionString: azureAcsUrl,
      accessToken: azureAcsKey
    });

    const response = await azureAcs.fetchActiveConstraints();
    await doubleWriteStrategy.write({ type: 'fetchActiveConstraints', data: response.data });
    return response.data;
  } catch (error) {
    logger.error(`Error fetching active constraints: ${error.message}`);
    throw error;
  }
};

const fetchPreCallBrief = async (prospectId) => {
  try {
    const azureAcs = new AzureAcs({
      connectionString: azureAcsUrl,
      accessToken: azureAcsKey
    });

    const response = await azureAcs.fetchPreCallBrief(prospectId);
    await doubleWriteStrategy.write({ type: 'fetchPreCallBrief', data: response.data });
    return response.data;
  } catch (error) {
    logger.error(`Error fetching pre-call brief for prospect ${prospectId}: ${error.message}`);
    throw error;
  }
};

const textToSpeech = async (text, voiceName) => {
  try {
    const response = await axios.post(`${azureAcsUrl}/text-to-speech`, {
      text,
      voiceName,
    }, {
      headers: {
        'Ocp-Apim-Subscription-Key': azureAcsKey,
        'Content-Type': 'application/json',
      },
    });
    await doubleWriteStrategy.write({ type: 'textToSpeech', data: response.data });
    return response.data.audioUrl;
  } catch (error) {
    logger.error(`Error converting text to speech: ${error.message}`);
    throw error;
  }
};

module.exports = {
  createCall,
  handleVoicemailDrop,
  getTranscriptionResult,
  detectResistanceOrRegulatoryEdgeCases,
  updateCallFlags,
  getCallFlags,
  fetchActiveConstraints,
  fetchPreCallBrief,
  textToSpeech,
};
