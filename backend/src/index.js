import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

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

// Routes
import authRoutes from './routes/authRoutes.js';
import enrollmentRoutes from './routes/enrollmentRoutes.js';
import mlRoutes from './routes/mlRoutes.js';
import classRoutes from './routes/classRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

app.use('/api/auth', authRoutes);
app.use('/api/enrollment', enrollmentRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
