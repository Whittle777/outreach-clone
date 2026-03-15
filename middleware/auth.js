const jwt = require('jsonwebtoken');
const { google } = require('googleapis');

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

module.exports = { authenticateToken, authenticateGoogleWorkspaceToken };
