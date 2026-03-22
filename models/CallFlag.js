module.exports = {
  CallFlag: {
    async create(data) {
      return await prisma.callFlag.create({ data });
    },
    async findMany() {
      return await prisma.callFlag.findMany();
    },
    async findUnique(where) {
      return await prisma.callFlag.findUnique({ where });
    },
  },
};
