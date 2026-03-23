const request = require('supertest');
const app = require('../app'); // Assuming the main app file is named app.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('Prospects API', () => {
  // Clean up the database before each test
  beforeEach(async () => {
    await prisma.prospect.deleteMany();
  });

  // Clean up the database after all tests
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /prospects', () => {
    it('should return an empty array if no prospects exist', async () => {
      const response = await request(app).get('/prospects');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return all prospects', async () => {
      const prospect1 = await prisma.prospect.create({
        data: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      });
      const prospect2 = await prisma.prospect.create({
        data: { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' },
      });

      const response = await request(app).get('/prospects');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        { id: prospect1.id, firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        { id: prospect2.id, firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' },
      ]);
    });
  });

  describe('GET /prospects/:id', () => {
    it('should return a prospect by id', async () => {
      const prospect = await prisma.prospect.create({
        data: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      });

      const response = await request(app).get(`/prospects/${prospect.id}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: prospect.id, firstName: 'John', lastName: 'Doe', email: 'john@example.com' });
    });

    it('should return 404 if prospect does not exist', async () => {
      const response = await request(app).get('/prospects/999');
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Cannot find prospect' });
    });
  });

  describe('POST /prospects', () => {
    it('should create a new prospect', async () => {
      const response = await request(app).post('/prospects').send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        id: expect.any(Number),
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      });
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app).post('/prospects').send({});
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: expect.any(String) });
    });
  });

  describe('PUT /prospects/:id', () => {
    it('should update an existing prospect', async () => {
      const prospect = await prisma.prospect.create({
        data: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      });

      const response = await request(app).put(`/prospects/${prospect.id}`).send({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: prospect.id,
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
      });
    });

    it('should return 404 if prospect does not exist', async () => {
      const response = await request(app).put('/prospects/999').send({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
      });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Cannot find prospect' });
    });

    it('should return 400 if required fields are missing', async () => {
      const prospect = await prisma.prospect.create({
        data: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      });

      const response = await request(app).put(`/prospects/${prospect.id}`).send({});
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: expect.any(String) });
    });
  });

  describe('DELETE /prospects/:id', () => {
    it('should delete an existing prospect', async () => {
      const prospect = await prisma.prospect.create({
        data: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      });

      const response = await request(app).delete(`/prospects/${prospect.id}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Deleted prospect' });
    });

    it('should return 404 if prospect does not exist', async () => {
      const response = await request(app).delete('/prospects/999');
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Cannot find prospect' });
    });
  });
});
