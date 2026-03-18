const express = require('express');
const acsAuth = require('../middleware/acsAuth');
const router = express.Router();

// Example protected route for ACS API calls
router.get('/call', acsAuth, (req, res) => {
  res.json({ message: 'This is a protected ACS call route', userId: req.userId, bento: req.bento });
});

module.exports = router;
