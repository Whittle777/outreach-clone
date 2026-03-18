const redis = require('redis');

const redisClient = redis.createClient({
  url: 'redis://localhost:6379', // Update with your Redis server URL
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

(async () => {
  await redisClient.connect();
})();

module.exports = redisClient;
