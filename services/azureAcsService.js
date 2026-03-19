const axios = require('axios');
const logger = require('../services/logger');
const AzureAcs = require('../messageBroker/azureAcs');

const azureAcsUrl = process.env.AZURE_ACS_URL || 'https://your-azure-acs-url.com';
const azureAcsKey = process.env.AZURE_ACS_KEY || 'your-azure-acs-key';

const createCall = async (prospectId, bento, teamsResourceAccountObjectId) => {
  try {
    const azureAcs = new AzureAcs({
      connectionString: azureAcsUrl,
      accessToken: azureAcsKey
    });

    const response = await azureAcs.createCall(prospectId, 'US', teamsResourceAccountObjectId);
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
    return response.data;
  } catch (error) {
    logger.error(`Error getting call flags for call ${callId}: ${error.message}`);
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
};
