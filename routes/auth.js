const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { registerUser, loginUser } = require('../services/userService');
const { authenticateToken } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

// POST /auth/register
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    await registerUser(email, password, name);
    res.status(201).json({ message: 'Registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  try {
    const user = await loginUser(email, password);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '1h' }
    );
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, username: user.username },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, username: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
