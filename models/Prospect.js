const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createProspect(firstName, lastName, email, companyName, status) {
  return await prisma.prospect.create({
    data: {
      firstName,
      lastName,
      email,
      companyName,
      status,
    },
  });
}

async function getProspectById(id) {
  return await prisma.prospect.findUnique({
    where: { id },
  });
}

async function getAllProspects() {
  return await prisma.prospect.findMany();
}

async function updateProspect(id, firstName, lastName, email, companyName, status) {
  return await prisma.prospect.update({
    where: { id },
    data: { firstName, lastName, email, companyName, status },
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
