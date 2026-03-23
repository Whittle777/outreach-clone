const { PrismaClient } = require('@prisma/client');
const config = require('../config/index').getConfig();

const getShardUrl = (shardKey, shardValue) => {
  const shardIndex = Math.abs(shardValue.hashCode()) % config.sharding.numberOfShards;
  return `${config.prisma.url}_shard${shardIndex}`;
};

String.prototype.hashCode = function() {
  let hash = 0;
  if (this.length === 0) return hash;
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
};

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getShardUrl(config.sharding.shardKey, req.bento), // Assuming req.bento is available in the context
    },
  },
});

module.exports = prisma;
