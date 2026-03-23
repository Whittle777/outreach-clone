const express = require('express');
const rateLimit = require('./middleware/rateLimiter');
const config = require('./config');

const app = express();
const { rateLimitRefillRate, rateLimitBucketCapacity } = config.getConfig();

app.use(rateLimit(rateLimitRefillRate, rateLimitBucketCapacity));

// Other routes and middleware

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
