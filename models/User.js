const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function comparePassword(candidatePassword, hashedPassword) {
  return await bcrypt.compare(candidatePassword, hashedPassword);
}

async function updateUserOAuthTokens(userId, accessToken, refreshToken) {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      accessToken,
      refreshToken,
    },
  });
}

module.exports = {
  hashPassword,
  comparePassword,
  updateUserOAuthTokens,
  prisma
};
