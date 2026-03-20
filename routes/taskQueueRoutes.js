const express = require('express');
const NGOETaskQueue = require('../services/ngoeTaskQueue');
const router = express.Router();

const ngoeTaskQueue = new NGOETaskQueue({});

router.post('/enqueue', async (req, res) => {
  const task = req.body;
  await ngoeTaskQueue.enqueue(task);
  res.status(201).send({ message: 'Task enqueued' });
});

router.get('/dequeue', async (req, res) => {
  const task = await ngoeTaskQueue.dequeue();
  res.status(200).send(task);
});

module.exports = router;
