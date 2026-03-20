// routes/ttsRoutes.js

const express = require('express');
const ttsController = require('../controllers/ttsController');

const router = express.Router();

router.post('/generate-tts-audio', ttsController.generateTtsAudio);

module.exports = router;
