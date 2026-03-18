const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const userService = require('../services/userService');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.bento = decoded.bento; // Add bento to the request object
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}

async function authenticateGoogleWorkspaceToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const ticket = await google.oauth2('v4').tokeninfo({
      auth: null,
      access_token: token,
    });

    if (ticket.data.aud !== process.env.GOOGLE_CLIENT_ID) {
      return res.status(403).json({ message: 'Invalid token audience' });
    }

    req.userId = ticket.data.sub;
    req.bento = ticket.data.bento; // Add bento to the request object
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired Google token' });
  }
}

async function authenticateMicrosoftToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const response = await axios.get('https://graph.microsoft.com/oidc/userinfo', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const userId = response.data.sub;
    const bento = response.data.bento; // Assuming bento is part of the response

    req.userId = userId;
    req.bento = bento; // Add bento to the request object
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired Microsoft token' });
  }
}

async function authenticateWebhook(req, res, next) {
  const webhookSecret = process.env.WEBHOOK_SECRET;
  const signature = req.headers['x-webhook-signature'];

  if (!signature) {
    return res.status(401).json({ message: 'Access denied. No signature provided.' });
  }

  const hmac = crypto.createHmac('sha256', webhookSecret);
  hmac.update(JSON.stringify(req.body));
  const expectedSignature = hmac.digest('hex');

  if (signature !== expectedSignature) {
    return res.status(403).json({ message: 'Invalid signature' });
  }

  next();
}

module.exports = { authenticateToken, authenticateGoogleWorkspaceToken, authenticateMicrosoftToken, authenticateWebhook };
