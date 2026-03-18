const jwt = require('jsonwebtoken');

function authenticateACSToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACS_API_SECRET);
    req.userId = decoded.userId;
    req.bento = decoded.bento; // Add bento to the request object
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired ACS token' });
  }
}

module.exports = authenticateACSToken;
