const express = require('express');
const bodyParser = require('body-parser');
const voiceAgentRoutes = require('./routes/voiceAgent');
const awsSqsConsumer = require('./services/awsSqsConsumer');

const app = express();

app.use(bodyParser.json());

// Include the voice agent routes
app.use('/api/voice-agent', voiceAgentRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  // Start the AWS SQS consumer
  awsSqsConsumer.consumeMessages();
});
