const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllSequences = async (req, res) => {
  try {
    const sequences = await prisma.sequence.findMany();
    res.json(sequences);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sequences' });
  }
};

exports.getSequenceById = async (req, res) => {
  try {
    const sequence = await prisma.sequence.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { steps: true },
    });
    if (!sequence) {
      return res.status(404).json({ error: 'Sequence not found' });
    }
    res.json(sequence);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sequence' });
  }
};

exports.createSequence = async (req, res) => {
  try {
    const { userId, name } = req.body;
    const sequence = await prisma.sequence.create({
      data: {
        userId,
        name,
      },
    });
    res.status(201).json(sequence);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create sequence' });
  }
};

exports.updateSequence = async (req, res) => {
  try {
    const { name } = req.body;
    const sequence = await prisma.sequence.update({
      where: { id: parseInt(req.params.id) },
      data: { name },
    });
    res.json(sequence);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update sequence' });
  }
};

exports.deleteSequence = async (req, res) => {
  try {
    const sequence = await prisma.sequence.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.json(sequence);
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete sequence' });
  }
};
