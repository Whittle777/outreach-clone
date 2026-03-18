const axios = require('axios');

async function callGoMicroservice(prospectId, bento) {
  try {
    const response = await axios.post('http://go-microservice/rate-limit', {
      prospectId,
      bento,
    });
    return response.data.isAllowed;
  } catch (error) {
    console.error('Error calling Go microservice:', error);
    throw new Error('Failed to communicate with Go microservice');
  }
}

module.exports = {
  callGoMicroservice,
};
