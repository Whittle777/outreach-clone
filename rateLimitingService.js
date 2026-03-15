const redis = require('redis');
const client = redis.createClient();

client.on('error', (err) => {
  console.error('Redis error:', err);
});

async function checkAndIncrementThrottle(key, limit, interval) {
  const current = await client.get(key);
  if (current && parseInt(current) >= limit) {
    return false;
  }
  await client.multi()
    .incr(key)
    .expire(key, interval)
    .exec();
  return true;
}

async function throttleRequest(userId, organizationId, prospectId, domain, action) {
  const userKey = `throttle:user:${userId}:${action}`;
  const organizationKey = `throttle:organization:${organizationId}:${action}`;
  const prospectKey = `throttle:prospect:${prospectId}:${action}`;
  const domainKey = `throttle:domain:${domain}:${action}`;

  const userLimit = 1000; // Example limit
  const organizationLimit = 5000; // Example limit
  const prospectLimit = 100; // Example limit
  const domainLimit = 2000; // Example limit

  const interval = 24 * 60 * 60; // 1 day in seconds

  const userAllowed = await checkAndIncrementThrottle(userKey, userLimit, interval);
  const organizationAllowed = await checkAndIncrementThrottle(organizationKey, organizationLimit, interval);
  const prospectAllowed = await checkAndIncrementThrottle(prospectKey, prospectLimit, interval);
  const domainAllowed = await checkAndIncrementThrottle(domainKey, domainLimit, interval);

  return userAllowed && organizationAllowed && prospectAllowed && domainAllowed;
}

module.exports = {
  throttleRequest,
};
