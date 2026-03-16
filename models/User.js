const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function comparePassword(candidatePassword, hashedPassword) {
  return await bcrypt.compare(candidatePassword, hashedPassword);
}

async function createUser(email, password, bento) {
  const shard = getShard(bento);
  const hashedPassword = await hashPassword(password);
  return await prisma[shard].user.create({
    data: {
      email,
      password: hashedPassword,
      bento,
    },
  });
}

async function getUserByEmail(email, bento) {
  const shard = getShard(bento);
  return await prisma[shard].user.findUnique({
    where: { email },
  });
}

async function updateUserOAuthTokens(userId, accessToken, refreshToken, bento) {
  const shard = getShard(bento);
  return await prisma[shard].user.update({
    where: { id: userId },
    data: {
      accessToken,
      refreshToken,
    },
  });
}

async function updateUserMicrosoftTokens(userId, accessToken, refreshToken, bento) {
  const shard = getShard(bento);
  return await prisma[shard].user.update({
    where: { id: userId },
    data: {
      microsoftAccessToken: accessToken,
      microsoftRefreshToken: refreshToken,
    },
  });
}

function getShard(bento) {
  // Simple sharding logic based on bento value
  // For example, you can use a hash function or a modulo operation
  return `shard_${bento % 3}`;
}

module.exports = {
  hashPassword,
  comparePassword,
  createUser,
  getUserByEmail,
  updateUserOAuthTokens,
  updateUserMicrosoftTokens,
};
