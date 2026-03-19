const express = require('express');
const router = express.Router();
const audioFileController = require('../controllers/audioFileController');

router.post('/upload', audioFileController.uploadAudioFile);
router.get('/retrieve/:fileName', audioFileController.getAudioFileUrl);

module.exports = router;
