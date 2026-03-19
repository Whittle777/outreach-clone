const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const AudioStorage = require('../services/audioStorage');
const AudioFile = require('../models/AudioFile');

const audioStorage = new AudioStorage();

router.post('/upload', upload.single('audio'), async (req, res) => {
  try {
    const file = req.file;
    const metadata = req.body; // Assuming metadata is sent in the request body

    const audioFile = await AudioFile.create(file, metadata);
    const fileUrl = await audioStorage.uploadAudioFile(file, metadata);

    await AudioFile.update(audioFile.id, { fileUrl });

    res.status(201).json({ fileUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/retrieve/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    const audioFile = await AudioFile.findById(fileId);

    if (!audioFile) {
      return res.status(404).json({ error: 'Audio file not found' });
    }

    const file = await audioStorage.retrieveAudioFile(fileId);

    res.status(200).json({ file });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
