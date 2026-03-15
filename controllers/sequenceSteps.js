const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllSequenceSteps = async (req, res) => {
  try {
    const sequenceSteps = await prisma.sequenceStep.findMany();
    res.json(sequenceSteps);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sequence steps' });
  }
};

exports.getSequenceStepById = async (req, res) => {
  try {
    const sequenceStep = await prisma.sequenceStep.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!sequenceStep) {
      return res.status(404).json({ error: 'Sequence step not found' });
    }
    res.json(sequenceStep);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sequence step' });
  }
};

exports.createSequenceStep = async (req, res) => {
  try {
    const { sequenceId, order, delayDays, subject, body } = req.body;
    const sequenceStep = await prisma.sequenceStep.create({
      data: {
        sequenceId,
        order,
        delayDays,
        subject,
        body,
      },
    });
    res.status(201).json(sequenceStep);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create sequence step' });
  }
};

exports.updateSequenceStep = async (req, res) => {
  try {
    const { order, delayDays, subject, body } = req.body;
    const sequenceStep = await prisma.sequenceStep.update({
      where: { id: parseInt(req.params.id) },
      data: { order, delayDays, subject, body },
    });
    res.json(sequenceStep);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update sequence step' });
  }
};

exports.deleteSequenceStep = async (req, res) => {
  try {
    const sequenceStep = await prisma.sequenceStep.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.json(sequenceStep);
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete sequence step' });
  }
};
