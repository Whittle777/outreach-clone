// app.js

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const ttsRoutes = require('./routes/ttsRoutes');
const config = require('./services/config');
const session = require('express-session');
const MemoryStore = session.MemoryStore;
const quarterlyPerformancePrediction = require('./services/quarterlyPerformancePrediction');
const mcpGatewayRoutes = require('./routes/mcpGateway');

const app = express();

// Configure session middleware
app.use(session({
  store: new MemoryStore(),
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));

app.use(cors());
app.use(bodyParser.json());

app.use('/api/tts', ttsRoutes);
app.use('/api/mcpGateway', mcpGatewayRoutes);

// New route for quarterly performance predictions
app.get('/api/predictions/quarterly', quarterlyPerformancePrediction.getPredictions);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

config.initializeCronJobs();

// Export the app for testing purposes
module.exports = app;
