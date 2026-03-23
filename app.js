const express = require('express');
const rateLimit = require('./middleware/rateLimit');
const config = require('./config');

const app = express();
const { refillRate, bucketCapacity } = config.getConfig();

app.use(rateLimit(refillRate, bucketCapacity));

// Other routes and middleware

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
