require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bfhlRouter = require('./routes/bfhl');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all origins to allow evaluator testing
app.use(cors());
app.use(express.json());

// Main route for verification
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: 'Chitkara Full Stack Engineering Challenge API is online.',
    endpoint: '/bfhl'
  });
});

// Register routes
app.use('/bfhl', bfhlRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
