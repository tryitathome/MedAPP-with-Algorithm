import express, { Request, Response, NextFunction } from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { getDataBackend } from './config/data-backend';
import { testSupabaseConnection } from './config/supabase';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error.middleware';
import routes from './routes';
import path from 'path';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const wait = (milliseconds: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, milliseconds));

async function connectSupabaseWithRetry(maxAttempts = 3): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await testSupabaseConnection();
      return;
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      const message = error instanceof Error ? error.message : String(error);
      logger.warn(
        `Supabase connection attempt ${attempt}/${maxAttempts} failed: ${message}. Retrying...`
      );
      await wait(attempt * 1000);
    }
  }
}

// Security middleware
app.use(helmet());
// CORS
const allowedOrigins: string[] = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001'
];
const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true); // allow non-browser tools
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
// Handle CORS preflight requests for all routes
app.options('*', cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads (must be before routes & 404)
const uploadsDir = path.join(__dirname, '../uploads');
app.use('/uploads', (req: Request, res: Response, next: NextFunction) => {
  // 为静态文件设置CORS头 - 允许多个来源和匿名请求
  const origin = req.headers.origin as string | undefined;
  if (!origin || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Credentials', 'false'); // 匿名CORS请求不需要凭据
  next();
}, express.static(uploadsDir));

// Routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const startServer = async () => {
  try {
    const dataBackend = getDataBackend();
    if (dataBackend === 'memory') {
      logger.warn('Using in-memory persistence (NO_DB=true or DATA_BACKEND=memory)');
    } else if (dataBackend === 'mongodb') {
      await connectDatabase();
    } else {
      await connectSupabaseWithRetry();
    }

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Data backend: ${dataBackend}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    // If NO_DB=true, still try to start the server without DB
    if (process.env.NO_DB === 'true') {
      app.listen(PORT, () => {
        logger.info(`Server running on port ${PORT}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.warn('Started WITHOUT database due to NO_DB=true');
      });
      return;
    }
    process.exit(1);
  }
};

startServer();

export default app;
