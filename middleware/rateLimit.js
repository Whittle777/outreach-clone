const redis = require('redis');
const client = redis.createClient();
const tokenBucketScript = require('../lua/tokenBucket.lua');

client.on('error', (err) => {
  console.error('Redis error:', err);
});

const rateLimit = (refillRate, bucketCapacity) => {
  return (req, res, next) => {
    const bucketKey = `rate_limit:${req.ip}`;
    const requestTokens = 1;

    client.eval(tokenBucketScript, 1, bucketKey, refillRate, bucketCapacity, requestTokens, (err, result) => {
      if (err) {
        console.error('Error evaluating token bucket script:', err);
        return res.status(500).send('Internal Server Error');
      }

      if (result === 1) {
        next();
      } else {
        res.status(429).send('Too Many Requests');
      }
    });
  };
};

module.exports = rateLimit;
