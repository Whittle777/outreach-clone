const express = require('express');
const dealHealthController = require('../controllers/dealHealthController');

const router = express.Router();

router.get('/dashboard', dealHealthController.getDashboardData);

module.exports = router;
