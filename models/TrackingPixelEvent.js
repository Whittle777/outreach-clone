const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function logTrackingPixelEvent(prospectId, bento, trackingPixelData) {
  const shard = getShard(bento);
  return await prisma[shard].trackingPixelEvent.create({
    data: {
      prospectId,
      bento,
      trackingPixelData,
    },
  });
}

async function getTrackingPixelEventsByProspectId(prospectId, bento) {
  const shard = getShard(bento);
  return await prisma[shard].trackingPixelEvent.findMany({
    where: { prospectId },
  });
}

async function getTrackingPixelEventsByBento(bento) {
  const shard = getShard(bento);
  return await prisma[shard].trackingPixelEvent.findMany({
    where: { bento },
  });
}

function getShard(bento) {
  // Simple sharding logic based on bento value
  // For example, you can use a hash function or a modulo operation
  return `shard_${bento % 3}`;
}

module.exports = {
  logTrackingPixelEvent,
  getTrackingPixelEventsByProspectId,
  getTrackingPixelEventsByBento,
};
