const express = require('express');
const router = express.Router();
const { prisma } = require('../models/User');
const authenticateToken = require('../middleware/auth');

// Get all users (protected)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single user by ID (protected)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user by ID (protected)
router.put('/:id', authenticateToken, async (req, res) => {
  const { username, email } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({ where: { email } });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Check if username is already taken by another user
    if (username && username !== existingUser.username) {
      const usernameExists = await prisma.user.findUnique({ where: { username } });
      if (usernameExists) {
        return res.status(400).json({ message: 'Username already in use' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { username, email }
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user by ID (protected)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const existingUser = await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    await prisma.user.delete({
      where: { id: parseInt(req.params.id) }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
