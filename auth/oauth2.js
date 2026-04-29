const axios = require('axios');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/index').getConfig();

class OAuth2 {
  constructor(provider) {
    this.provider = provider;
    this.config = config[provider];
  }

  async getAccessToken(code) {
    const { clientId, clientSecret, redirectUri, tokenUrl } = this.config;

    const response = await axios.post(tokenUrl, {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    return response.data.access_token;
  }

  async getUserInfo(accessToken) {
    const { userInfoUrl } = this.config;

    const response = await axios.get(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }

  generateJwtToken(userId, bento) {
    return jwt.sign({ userId, bento }, process.env.JWT_SECRET, { expiresIn: '1h' });
  }
}

module.exports = {
  GoogleOAuth2: new OAuth2('google'),
  MicrosoftOAuth2: new OAuth2('microsoft'),
};
