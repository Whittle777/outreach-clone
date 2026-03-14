const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  createSequence,
  getSequenceById,
  updateSequence,
  deleteSequence,
} = require('../models/Sequence');
const {
  createSequenceStep,
  getSequenceStepsBySequenceId,
  updateSequenceStep,
  deleteSequenceStep,
} = require('../models/SequenceStep');

router.use(authenticateToken);

router.post('/', async (req, res) => {
  const { name } = req.body;
  const userId = req.user.id;
  try {
    const sequence = await createSequence(userId, name);
    res.status(201).json(sequence);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const sequence = await getSequenceById(id);
    if (sequence) {
      res.json(sequence);
    } else {
      res.status(404).json({ message: 'Sequence not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const sequence = await updateSequence(id, name);
    res.json(sequence);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await deleteSequence(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/steps', async (req, res) => {
  const { id } = req.params;
  const { order, delayDays, subject, body } = req.body;
  try {
    const step = await createSequenceStep(id, order, delayDays, subject, body);
    res.status(201).json(step);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id/steps', async (req, res) => {
  const { id } = req.params;
  try {
    const steps = await getSequenceStepsBySequenceId(id);
    res.json(steps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/steps/:stepId', async (req, res) => {
  const { id, stepId } = req.params;
  const { order, delayDays, subject, body } = req.body;
  try {
    const step = await updateSequenceStep(stepId, order, delayDays, subject, body);
    res.json(step);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id/steps/:stepId', async (req, res) => {
  const { stepId } = req.params;
  try {
    await deleteSequenceStep(stepId);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
