const express = require('express');
const multer = require('multer');
const path = require('path');
const AudioFile = require('../models/AudioFile');
const audioFileStorage = require('../services/audioFileStorage');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }

  try {
    const file = req.file;
    const metadata = { prospectId: req.body.prospectId }; // Assuming prospectId is passed in the request body
    const country = req.body.country; // Assuming country is passed in the request body

    const audioFile = await AudioFile.create(file, metadata, country);
    const fileUrl = await audioFileStorage.uploadAudioFile(file.filename, file.path);
    await AudioFile.updateFileUrl(audioFile.id, fileUrl);

    res.status(201).send({ id: audioFile.id, fileUrl });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.delete('/delete/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const audioFile = await AudioFile.findById(id);
    if (!audioFile) {
      return res.status(404).send('Audio file not found');
    }

    const fileName = path.basename(audioFile.fileUrl);
    await audioFileStorage.deleteAudioFile(fileName);
    await AudioFile.delete(id);

    res.status(204).send();
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;
