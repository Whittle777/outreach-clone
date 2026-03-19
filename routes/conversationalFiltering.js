// routes/conversationalFiltering.js

const express = require('express');
const router = express.Router();
const conversationalFilteringController = require('../controllers/conversationalFiltering');

router.post('/filter', conversationalFilteringController.filterConversation);

module.exports = router;
