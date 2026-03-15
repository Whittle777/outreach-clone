const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createAbuseComplaint(prospectId, bento) {
  const shard = getShard(bento);
  return await prisma[shard].abuseComplaint.create({
    data: {
      prospectId,
      bento,
    },
  });
}

async function getAbuseComplaintCount(bento) {
  const shard = getShard(bento);
  const complaints = await prisma[shard].abuseComplaint.findMany({
    where: { bento },
  });
  return complaints.length;
}

function getShard(bento) {
  // Simple sharding logic based on bento value
  // For example, you can use a hash function or a modulo operation
  return `shard_${bento % 3}`;
}

module.exports = { createAbuseComplaint, getAbuseComplaintCount };
