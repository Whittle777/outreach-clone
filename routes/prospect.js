const express = require('express');
const Prospect = require('../models/Prospect');

const router = express.Router();

// Endpoint to mark a prospect as failed
router.post('/mark-as-failed', async (req, res) => {
  const { prospectId, bento } = req.body;

  try {
    await Prospect.markProspectAsFailed(prospectId, bento);
    res.status(200).json({ message: 'Prospect marked as failed successfully' });
  } catch (error) {
    console.error('Error marking prospect as failed:', error);
    res.status(500).json({ error: 'Failed to mark prospect as failed' });
  }
});

module.exports = router;
