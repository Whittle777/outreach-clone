const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');

async function registerUser(email, password, bento) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      bento,
    },
  });
  return user;
}

async function loginUser(email, password) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return null;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return null;
  }

  const token = jwt.sign({ userId: user.id, bento: user.bento }, 'your-secret-key', { expiresIn: '1h' });
  return { user, token };
}

async function getAllUsers() {
  return await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      createdAt: true,
      bento: true,
    },
  });
}

async function getUserById(id) {
  return await prisma.user.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true,
      email: true,
      createdAt: true,
      bento: true,
    },
  });
}

async function updateUser(id, email, password, bento) {
  const existingUser = await prisma.user.findUnique({ where: { id: parseInt(id) } });
  if (!existingUser) {
    return null;
  }

  // Check if email is already taken by another user
  if (email && email !== existingUser.email) {
    const emailExists = await prisma.user.findUnique({ where: { email } });
    if (emailExists) {
      return null;
    }
  }

  // Hash new password if provided
  let hashedPassword = existingUser.password;
  if (password) {
    hashedPassword = await bcrypt.hash(password, 10);
  }

  return await prisma.user.update({
    where: { id: parseInt(id) },
    data: { email, password: hashedPassword, bento },
  });
}

async function deleteUser(id) {
  const existingUser = await prisma.user.findUnique({ where: { id: parseInt(id) } });
  if (!existingUser) {
    return null;
  }

  await prisma.user.delete({
    where: { id: parseInt(id) },
  });

  return existingUser;
}

module.exports = {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
