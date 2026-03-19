// app.js

const express = require('express');
const bodyParser = require('body-parser');
const voiceAgentRoutes = require('./routes/voiceAgent');
const awsSqsConsumer = require('./services/awsSqsConsumer');
const prospectRoutes = require('./routes/prospect'); // New route for prospects
const sentimentAnalysisRoutes = require('./routes/sentimentAnalysis'); // New route for sentiment analysis
const conversationalFilteringRoutes = require('./routes/conversationalFiltering'); // New route for conversational filtering
const filterRoutes = require('./routes/filterRoutes'); // New route for filter chip data

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  // Start the AWS SQS consumer
  awsSqsConsumer.consumeMessages();
});
