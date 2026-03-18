const axios = require('axios');
const jwt = require('jsonwebtoken');

async function authenticateTeamsToken(token) {
  try {
    const response = await axios.get('https://graph.microsoft.com/oidc/userinfo', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const userId = response.data.sub;
    const bento = response.data.bento; // Assuming bento is part of the response

    const payload = {
      userId,
      bento,
    };

    const secret = process.env.JWT_SECRET;
    const options = {
      expiresIn: '1h',
    };

    const jwtToken = jwt.sign(payload, secret, options);

    return jwtToken;
  } catch (error) {
    throw new Error('Invalid or expired Microsoft Teams token');
  }
}

module.exports = { authenticateTeamsToken };
