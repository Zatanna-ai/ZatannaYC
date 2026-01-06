import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import ycDashboardRouter from './routes/yc/dashboard';
import ycFoundersRouter from './routes/yc/founders';
// import discoverYcRouter from './routes/yc/discover'; // TODO: Add llmProvider dependency

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info({ method: req.method, path: req.path }, 'Incoming request');
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1/yc-dashboard', ycDashboardRouter);
app.use('/api/v1/yc-founders', ycFoundersRouter);
// app.use('/api/v1/discover-yc', discoverYcRouter); // TODO: Add llmProvider dependency

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({ err, path: req.path }, 'Request error');
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Zatanna YC Backend API started');
});
