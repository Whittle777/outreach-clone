const express = require('express');
const bodyParser = require('body-parser');
const MessageBroker = require('./messageBroker');
const config = require('./config/settings');
const logger = require('./services/logger');
const conversationalFilteringRoutes = require('./routes/conversationalFiltering');

const app = express();
app.use(bodyParser.json());

const messageBroker = new MessageBroker(config);
messageBroker.startAwsSqsConsumer();

// Define a route to classify buyer sentiment
app.post('/api/classify-sentiment', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const sentimentData = await messageBroker.sentimentAnalysisService.analyze(text);
    res.json(sentimentData);
  } catch (error) {
    logger.error('Error classifying sentiment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Define CRUD routes for VoiceAgentCall
app.post('/api/voice-agent-calls', async (req, res) => {
  try {
    const { prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript } = req.body;
    const isCompliant = await messageBroker.isGDPRCompliant(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript);
    if (!isCompliant) {
      return res.status(400).json({ error: 'Data not compliant with GDPR' });
    }
    const voiceAgentCall = await messageBroker.createVoiceAgentCall(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript);
    res.status(201).json(voiceAgentCall);
  } catch (error) {
    logger.error('Error creating VoiceAgentCall:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/voice-agent-calls/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const voiceAgentCall = await messageBroker.getVoiceAgentCall(id);
    if (!voiceAgentCall) {
      return res.status(404).json({ error: 'VoiceAgentCall not found' });
    }
    res.json(voiceAgentCall);
  } catch (error) {
    logger.error('Error retrieving VoiceAgentCall:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/voice-agent-calls/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript } = req.body;
    const isCompliant = await messageBroker.isGDPRCompliant(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript);
    if (!isCompliant) {
      return res.status(400).json({ error: 'Data not compliant with GDPR' });
    }
    const updatedVoiceAgentCall = await messageBroker.updateVoiceAgentCall(id, { callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript });
    if (!updatedVoiceAgentCall) {
      return res.status(404).json({ error: 'VoiceAgentCall not found' });
    }
    res.json(updatedVoiceAgentCall);
  } catch (error) {
    logger.error('Error updating VoiceAgentCall:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/voice-agent-calls/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedVoiceAgentCall = await messageBroker.deleteVoiceAgentCall(id);
    if (!deletedVoiceAgentCall) {
      return res.status(404).json({ error: 'VoiceAgentCall not found' });
    }
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting VoiceAgentCall:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Define a route to make an outbound call
app.post('/api/make-outbound-call', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const callData = await messageBroker.makeOutboundCall(phoneNumber);
    res.status(201).json(callData);
  } catch (error) {
    logger.error('Error making outbound call:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Define a route to handle voicemail drop
app.post('/api/handle-voicemail-drop', async (req, res) => {
  try {
    const { prospectId, phoneNumber, message, token } = req.body;
    if (!prospectId || !phoneNumber || !message || !token) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await messageBroker.handleVoicemailDrop(prospectId, phoneNumber, message, token);
    res.status(200).json({ message: 'Voicemail drop handled successfully' });
  } catch (error) {
    logger.error('Error handling voicemail drop:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Add Conversational Filtering System routes
app.use('/api/conversational-filtering', conversationalFilteringRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.log(`Sentiment classification API listening on port ${PORT}`);
});
