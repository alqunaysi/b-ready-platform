import express from 'express';
import authRoutes from './routes/auth';
import assessmentRoutes from './routes/assessments';
import questionRoutes from './routes/questions';

// Create Express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/questions', questionRoutes);

// Healthcheck endpoint
app.get('/', (_req, res) => {
  res.json({ status: 'B-Ready API is running' });
});

// Start server
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});