const express = require('express');
const { run } = require('./services/emailDispatch');
const authenticateToken = require('./middleware/auth');

const app = express();
app.use(express.json());

// Start Kafka consumer
run().catch(console.error);

// Example protected route
app.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'This is a protected route', userId: req.userId, bento: req.bento });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
