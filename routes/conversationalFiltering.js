// routes/conversationalFiltering.js

const express = require('express');
const router = express.Router();
const conversationalFilteringController = require('../controllers/conversationalFiltering');
const conversationalFilteringSystem = require('../services/conversationalFilteringSystem');

router.post('/filter', conversationalFilteringController.filterConversation);
router.post('/shortcut', conversationalFilteringController.applyShortcut);

module.exports = router;
