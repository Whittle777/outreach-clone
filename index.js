require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const prospectsRoutes = require('./routes/prospects');
const sequencesRouter = require('./routes/sequences');
const sequenceStepsRouter = require('./routes/sequenceSteps');
const consumeMessages = require('./awsSqsConsumer');
const wss = require('./websocketServer');

const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

// Middleware
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/prospects', prospectsRoutes);
app.use('/sequences', sequencesRouter);
app.use('/sequenceSteps', sequenceStepsRouter);

app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Outreach Clone API' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Start consuming messages from SQS
consumeMessages();

// Start the WebSocket server
wss.on('listening', () => {
  console.log('WebSocket server is running on ws://localhost:8080');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
