const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTeamsResourceAccount(userId, bento) {
  const shard = getShard(bento);
  return await prisma[shard].teamsResourceAccount.create({
    data: {
      userId,
      bento,
    },
  });
}

async function getTeamsResourceAccount(userId, bento) {
  const shard = getShard(bento);
  return await prisma[shard].teamsResourceAccount.findUnique({
    where: { userId },
  });
}

async function updateTeamsResourceAccount(userId, bento, updateData) {
  const shard = getShard(bento);
  return await prisma[shard].teamsResourceAccount.update({
    where: { userId },
    data: updateData,
  });
}

async function deleteTeamsResourceAccount(userId, bento) {
  const shard = getShard(bento);
  return await prisma[shard].teamsResourceAccount.delete({
    where: { userId },
  });
}

function getShard(bento) {
  // Simple sharding logic based on bento value
  // For example, you can use a hash function or a modulo operation
  return `shard_${bento % 3}`;
}

module.exports = {
  createTeamsResourceAccount,
  getTeamsResourceAccount,
  updateTeamsResourceAccount,
  deleteTeamsResourceAccount,
};
