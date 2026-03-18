const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const azureCommunicationService = require('./azureCommunicationService');

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

async function initiateOutboundCall(userId, bento, phoneNumber) {
  const shard = getShard(bento);
  const teamsResourceAccount = await prisma[shard].teamsResourceAccount.findUnique({
    where: { userId },
  });

  if (!teamsResourceAccount) {
    throw new Error('Teams Resource Account not found');
  }

  const callConnection = await azureCommunicationService.initiateOutboundCall(teamsResourceAccount.objectId, phoneNumber);
  return callConnection;
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
  initiateOutboundCall,
};
