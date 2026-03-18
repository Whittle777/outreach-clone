const axios = require('axios');

async function makeOutboundCall(prospectId, bento) {
  try {
    const response = await axios.post('https://acs-call-automation-api.com/call', {
      prospectId,
      bento,
    });
    return response.data;
  } catch (error) {
    console.error('Error making outbound call:', error);
    throw new Error('Failed to make outbound call');
  }
}

module.exports = {
  makeOutboundCall,
};
