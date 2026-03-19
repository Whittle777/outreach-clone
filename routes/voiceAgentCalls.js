const express = require('express');
const router = express.Router();
const voiceAgentCallsController = require('../controllers/voiceAgentCalls');

router.post('/', voiceAgentCallsController.create);
router.get('/', voiceAgentCallsController.getAll);

module.exports = router;
