// app.js

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const ttsRoutes = require('./routes/ttsRoutes');
const config = require('./services/config');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/api/tts', ttsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

config.initializeCronJobs();
