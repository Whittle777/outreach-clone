const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios');

const mcpSecret = process.env.MCP_SECRET;
const mcpPublicKey = process.env.MCP_PUBLIC_KEY;

async function authenticateMcpToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, mcpPublicKey, { algorithms: ['RS256'] });
    req.mcpUserId = decoded.sub;
    req.mcpBento = decoded.bento; // Add bento to the request object
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired MCP token' });
  }
}

async function authenticateMcpWebhook(req, res, next) {
  const webhookSecret = process.env.MCP_WEBHOOK_SECRET;
  const signature = req.headers['x-mcp-signature'];

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

module.exports = { authenticateMcpToken, authenticateMcpWebhook };
