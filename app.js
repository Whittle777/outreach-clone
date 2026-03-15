const express = require('express');
const { run } = require('./services/emailDispatch');
const authenticateToken = require('./middleware/auth');
const rateLimit = require('./middleware/rateLimit');

const app = express();
app.use(express.json());

// Start Kafka consumer
run().catch(console.error);

// Example protected route with rate limiting
app.get('/protected', authenticateToken, rateLimit, (req, res) => {
  res.json({ message: 'This is a protected route', userId: req.userId, bento: req.bento });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
