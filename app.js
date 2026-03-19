// app.js

const express = require('express');
const bodyParser = require('body-parser');
const voiceAgentRoutes = require('./routes/voiceAgent');
const awsSqsConsumer = require('./services/awsSqsConsumer');
const prospectRoutes = require('./routes/prospect'); // New route for prospects
const sentimentAnalysisRoutes = require('./routes/sentimentAnalysis'); // New route for sentiment analysis
const conversationalFilteringRoutes = require('./routes/conversationalFiltering'); // New route for conversational filtering
const filterRoutes = require('./routes/filterRoutes'); // New route for filter chip data
const voiceAgentCallController = require('./controllers/voiceAgentCallController'); // New controller for voice agent calls
const emailRetryJob = require('./cronJobs/emailRetryJob'); // New cron job for email retries
const azureAcsService = require('./services/azureAcsService'); // New service for Azure ACS
const sentimentAnalysisService = require('./services/sentimentAnalysisService'); // New service for sentiment analysis

const app = express();

app.use(bodyParser.json());

// Include the voice agent routes
app.use('/api/voice-agent', voiceAgentRoutes);

// Include the prospect routes
app.use('/api/prospect', prospectRoutes);

// Include sentiment analysis routes
app.use('/api', sentimentAnalysisRoutes);

// Include conversational filtering routes
app.use('/api/conversational-filtering', conversationalFilteringRoutes);

// Include filter routes
app.use('/api', filterRoutes);

// Include voice agent call routes
app.get('/api/voice-agent-calls', voiceAgentCallController.getVoiceAgentCalls);

// New endpoint to retrieve real-time text transcripts
app.get('/api/transcripts/:callId', async (req, res) => {
  const { callId } = req.params;
  try {
    const transcriptionResult = await azureAcsService.getTranscriptionResult(callId);
    res.json(transcriptionResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// New endpoint to retrieve sentiment analysis results
app.get('/api/sentiment/:transcriptionId', async (req, res) => {
  const { transcriptionId } = req.params;
  try {
    const sentimentResult = await sentimentAnalysisService.analyze(transcriptionId);
    res.json(sentimentResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  // Start the AWS SQS consumer
  awsSqsConsumer.consumeMessages();
  // Start the email retry job
  emailRetryJob;
});
