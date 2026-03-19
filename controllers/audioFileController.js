const audioFileStorage = require('../services/audioStorage');
const AudioFile = require('../models/AudioFile');

async function uploadAudioFile(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const file = req.file;
  const metadata = { uploadedBy: req.user.id }; // Assuming user authentication is in place

  try {
    const audioFile = await AudioFile.create(file, metadata);
    const fileUrl = await audioFileStorage.uploadAudioFile(file.originalname, file.path);
    await AudioFile.updateFileUrl(audioFile.id, fileUrl);
    res.status(201).json({ fileUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload audio file' });
  }
}

async function getAudioFileUrl(req, res) {
  const fileName = req.params.fileName;

  try {
    const fileUrl = await audioFileStorage.getAudioFileUrl(fileName);
    res.status(200).json({ fileUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve audio file URL' });
  }
}

module.exports = {
  uploadAudioFile,
  getAudioFileUrl,
};
