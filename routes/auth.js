const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../services/userService');
const { getOAuthTokens, refreshOAuthTokens } = require('../services/oauthTokenService');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

// Register a new user
router.post('/register', async (req, res) => {
  const { email, password, bento } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const newUser = await registerUser(email, password, bento);

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login a user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await loginUser(email, password);

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, bento: user.bento }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Retrieve OAuth tokens
router.post('/oauth/token', async (req, res) => {
  const { email, bento } = req.body;

  try {
    const tokens = await getOAuthTokens(email, bento);
    res.json(tokens);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Refresh OAuth tokens
router.post('/oauth/refresh', async (req, res) => {
  const { refreshToken, bento } = req.body;

  try {
    const tokens = await refreshOAuthTokens(refreshToken, bento);
    res.json(tokens);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
