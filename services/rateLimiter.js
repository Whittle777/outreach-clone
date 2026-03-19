const redis = require('redis');
const client = redis.createClient({
  url: 'redis://localhost:6379'
});

client.on('error', (err) => {
  console.error('Redis Client Error', err);
});

async function incrementRequestCount(key) {
  await client.connect();
  const count = await client.incr(key);
  await client.expire(key, 60); // Set expiration to 60 seconds
  await client.disconnect();
  return count;
}

async function isRateLimited(key, limit) {
  await client.connect();
  const count = await client.get(key);
  await client.disconnect();
  return count >= limit;
}

module.exports = {
  incrementRequestCount,
  isRateLimited
};
