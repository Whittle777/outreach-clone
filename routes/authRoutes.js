const express = require('express');
const router = express.Router();
const teamsAuth = require('../services/teamsAuth');

router.post('/auth/microsoft', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Token is required' });
  }

  try {
    const jwtToken = await teamsAuth.authenticateTeamsToken(token);
    res.json({ token: jwtToken });
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
});

module.exports = router;
