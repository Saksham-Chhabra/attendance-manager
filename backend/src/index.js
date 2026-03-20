const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend is running' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
