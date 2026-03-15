const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const enforceSchemaTag = require('../middleware/schemaTag');

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

exports.createSequence = [
  enforceSchemaTag,
  async (req, res) => {
    try {
      const { userId, name, bento } = req.body;
      const sequence = await prisma.sequence.create({
        data: {
          userId,
          name,
          bento,
          schemaTag: req.schemaTag,
        },
      });
      res.status(201).json(sequence);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create sequence' });
    }
  }
];

exports.updateSequence = [
  enforceSchemaTag,
  async (req, res) => {
    try {
      const { name, bento } = req.body;
      const sequence = await prisma.sequence.update({
        where: { id: parseInt(req.params.id) },
        data: { name, bento, schemaTag: req.schemaTag },
      });
      res.json(sequence);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update sequence' });
    }
  }
];

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
