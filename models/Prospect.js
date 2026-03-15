const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createProspect(firstName, lastName, email, companyName, status, bento) {
  return await prisma.prospect.create({
    data: {
      firstName,
      lastName,
      email,
      companyName,
      status,
      bento,
    },
  });
}

async function getProspectById(id) {
  return await prisma.prospect.findUnique({
    where: { id },
  });
}

async function getAllProspects(bento) {
  return await prisma.prospect.findMany({
    where: { bento },
  });
}

async function updateProspect(id, firstName, lastName, email, companyName, status, bento) {
  return await prisma.prospect.update({
    where: { id },
    data: { firstName, lastName, email, companyName, status, bento },
  });
}

async function deleteProspect(id) {
  return await prisma.prospect.delete({
    where: { id },
  });
}

module.exports = {
  createProspect,
  getProspectById,
  getAllProspects,
  updateProspect,
  deleteProspect,
};
