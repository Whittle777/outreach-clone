const express = require('express');
const bodyParser = require('body-parser');
const config = require('./services/config');
const logger = require('./services/logger');
const PredictiveSearch = require('./services/predictiveSearch');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// Initialize services
config.initializeCronJobs();
const messageBroker = config.initializeMessageBroker();
const nlp = config.initializeNLP();
const intentDrivenShortcuts = config.initializeIntentDrivenShortcuts();
const predictiveSearch = config.initializePredictiveSearch();

// Predictive search endpoint
app.post('/predictive-search', async (req, res) => {
  const query = req.body.query;
  try {
    const results = await predictiveSearch.search(query);
    logger.predictiveSearch(query, results);
    res.json(results);
  } catch (error) {
    logger.error('Error during predictive search', { error });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
