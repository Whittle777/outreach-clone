const express = require('express');
const router = express.Router();
const { prisma } = require('../models/User');
const authenticateToken = require('../middleware/auth');

// Get all prospects (protected)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const prospects = await prisma.prospect.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        companyName: true,
        status: true,
        createdAt: true
      }
    });
    res.json(prospects);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single prospect by ID (protected)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const prospect = await prisma.prospect.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        companyName: true,
        status: true,
        createdAt: true
      }
    });

    if (!prospect) {
      return res.status(404).json({ message: 'Prospect not found' });
    }

    res.json(prospect);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new prospect (protected)
router.post('/', authenticateToken, async (req, res) => {
  const { firstName, lastName, email, companyName, status } = req.body;

  // Validate required fields
  if (!firstName || !lastName || !email) {
    return res.status(400).json({ message: 'First name, last name, and email are required' });
  }

  try {
    // Check if email already exists
    const existingProspect = await prisma.prospect.findUnique({ where: { email } });
    if (existingProspect) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const prospect = await prisma.prospect.create({
      data: { firstName, lastName, email, companyName, status }
    });

    res.status(201).json(prospect);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update prospect by ID (protected)
router.put('/:id', authenticateToken, async (req, res) => {
  const { firstName, lastName, email, companyName, status } = req.body;

  try {
    const existingProspect = await prisma.prospect.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!existingProspect) {
      return res.status(404).json({ message: 'Prospect not found' });
    }

    // Check if email is already taken by another prospect
    if (email && email !== existingProspect.email) {
      const emailExists = await prisma.prospect.findUnique({ where: { email } });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    const updatedProspect = await prisma.prospect.update({
      where: { id: parseInt(req.params.id) },
      data: { firstName, lastName, email, companyName, status }
    });

    res.json(updatedProspect);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete prospect by ID (protected)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const existingProspect = await prisma.prospect.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!existingProspect) {
      return res.status(404).json({ message: 'Prospect not found' });
    }

    await prisma.prospect.delete({
      where: { id: parseInt(req.params.id) }
    });

    res.json({ message: 'Prospect deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
