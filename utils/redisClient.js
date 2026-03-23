const redis = require('redis');
const { promisify } = require('util');

const config = require('../config').getConfig();

const client = redis.createClient({
  host: config.redisHost,
  port: config.redisPort,
  password: config.redisPassword
});

client.on('error', (err) => {
  console.error('Redis error:', err);
});

const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);
const delAsync = promisify(client.del).bind(client);

module.exports = {
  client,
  getAsync,
  setAsync,
  delAsync
};
