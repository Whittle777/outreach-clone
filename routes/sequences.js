const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getAllSequences,
  getSequenceById,
  createSequence,
  updateSequence,
  deleteSequence,
  updateSequenceState,
} = require('../controllers/sequences');

router.use(authenticateToken);

router.get('/', getAllSequences);

router.get('/:id', getSequenceById);

router.post('/', createSequence);

router.put('/:id', updateSequence);

router.delete('/:id', deleteSequence);

router.patch('/:id/state', updateSequenceState);

module.exports = router;
