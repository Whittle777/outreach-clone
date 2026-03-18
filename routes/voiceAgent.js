const express = require('express');
const router = express.Router();
const voiceAgentController = require('../controllers/voiceAgentController');

// Route to initiate a voice agent call
router.post('/initiate-call', voiceAgentController.initiateCall);

// Route to manage the status of a voice agent call
router.get('/call-status/:callId', voiceAgentController.getCallStatus);

module.exports = router;
