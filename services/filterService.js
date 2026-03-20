// services/filterService.js

const express = require('express');
const router = express.Router();
const { isGDPRCompliant } = require('../utils/gdprUtils');
const FilterChip = require('../components/FilterChip');

router.get('/active-constraints', async (req, res) => {
  const metadata = req.query.metadata;
  const country = req.query.country;

  if (!isGDPRCompliant(metadata, country)) {
    return res.status(400).json({ error: 'Data not compliant with GDPR' });
  }

  // Example active constraints
  const activeConstraints = [
    { label: 'High Confidence', value: 'high-confidence' },
    { label: 'Moderate Confidence', value: 'moderate-confidence' },
    { label: 'Low Confidence', value: 'low-confidence' }
  ];

  res.json(activeConstraints);
});

module.exports = router;
