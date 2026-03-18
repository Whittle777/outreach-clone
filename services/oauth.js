const axios = require('axios');
const jwt = require('jsonwebtoken');
const userService = require('../services/userService');

async function googleOAuthCallback(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ message: 'Authorization code is required' });
  }

  try {
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    const { access_token, id_token } = tokenResponse.data;

    const ticket = await google.oauth2('v4').tokeninfo({
      auth: null,
      access_token: id_token,
    });

    if (ticket.data.aud !== process.env.GOOGLE_CLIENT_ID) {
      return res.status(403).json({ message: 'Invalid token audience' });
    }

    const userId = ticket.data.sub;
    const email = ticket.data.email;
    const bento = ticket.data.bento; // Assuming bento is part of the response

    let user = await userService.getUserByEmail(email);

    if (!user) {
      user = await userService.createUser({ email, bento });
    }

    const token = jwt.sign({ userId, bento }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
  } catch (error) {
    console.error('Error during Google OAuth callback:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = { googleOAuthCallback };
