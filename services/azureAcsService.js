const axios = require('axios');
const logger = require('../services/logger');

const azureAcsUrl = process.env.AZURE_ACS_URL || 'https://your-azure-acs-url.com';
const azureAcsKey = process.env.AZURE_ACS_KEY || 'your-azure-acs-key';

const createCall = async (prospectId, bento, teamsResourceAccountObjectId) => {
  try {
    const response = await axios.post(`${azureAcsUrl}/calls`, {
      prospectId,
      bento,
      teamsResourceAccountObjectId,
    }, {
      headers: {
        'Ocp-Apim-Subscription-Key': azureAcsKey,
      },
    });
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

module.exports = {
  createCall,
  handleVoicemailDrop,
};
