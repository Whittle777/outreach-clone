const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const ttsRoutes = require('./routes/ttsRoutes');
const config = require('./services/config');
const session = require('express-session');
const MemoryStore = session.MemoryStore;
const quarterlyPerformancePrediction = require('./services/quarterlyPerformancePrediction');
const mcpGatewayRoutes = require('./routes/mcpGateway');
const dataResidencyMiddleware = require('./middleware/dataResidency');
const callRateLimiting = require('./middleware/callRateLimiting');
const constraintsRouter = require('./routes/constraints');
const winLossRoutes = require('./routes/winLossRoutes');
const quarterlyPerformanceRoutes = require('./routes/quarterlyPerformance'); // New routes for quarterly performance
const jwtValidation = require('./middleware/jwtValidation'); // Import JWT validation middleware

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

// Use data residency middleware
app.use(dataResidencyMiddleware);

// Apply JWT validation middleware to protected routes
app.use('/api/tts', jwtValidation, ttsRoutes);
app.use('/api/mcpGateway', jwtValidation, mcpGatewayRoutes);
app.use('/constraints', jwtValidation, constraintsRouter);
app.use('/api/winloss', jwtValidation, winLossRoutes);
app.use('/api/quarterlyPerformance', jwtValidation, quarterlyPerformanceRoutes); // New routes for quarterly performance

// New route for quarterly performance predictions
app.get('/api/predictions/quarterly', jwtValidation, quarterlyPerformancePrediction.getPredictions);

// New route for call rate limit enforcement
app.post('/call', callRateLimiting, (req, res) => {
  res.json({ message: 'Call allowed' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

config.initializeCronJobs();

// Export the app for testing purposes
module.exports = app;
