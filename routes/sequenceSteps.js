const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  createSequenceStep,
  getSequenceStepsBySequenceId,
  updateSequenceStep,
  deleteSequenceStep,
} = require('../models/SequenceStep');

router.use(authenticateToken);

router.post('/', async (req, res) => {
  const { sequenceId, order, delayDays, subject, body } = req.body;
  try {
    const step = await createSequenceStep(sequenceId, order, delayDays, subject, body);
    res.status(201).json(step);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const step = await getSequenceStepById(id);
    if (step) {
      res.json(step);
    } else {
      res.status(404).json({ message: 'Sequence Step not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { order, delayDays, subject, body } = req.body;
  try {
    const step = await updateSequenceStep(id, order, delayDays, subject, body);
    res.json(step);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await deleteSequenceStep(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
