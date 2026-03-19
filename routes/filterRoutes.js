// routes/filterRoutes.js

const express = require('express');
const router = express.Router();
const filterService = require('../services/filterService');

router.use('/filter', filterService);

module.exports = router;
