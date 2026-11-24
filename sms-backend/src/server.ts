import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/index.js';
import { query } from './config/db.js';
import { notFoundHandler, errorHandler } from './middleware/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
  try {
    const dbRes = await query('SELECT NOW() as now');
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: dbRes.rows[0].now,
      version: '1.0.0',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Database connection failed';
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: message,
    });
  }
});

// Global 404 handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 ACME SMS Backend running on http://localhost:${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
});

export default app;
