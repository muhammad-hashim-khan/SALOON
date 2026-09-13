import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { env } from './config/env';
import routes from './routes';
import { errorHandler, AppError } from './middleware/errorHandler';
import { logger } from './utils/logger';

export const createApp = (): Application => {
  const app = express();

  // Middleware: Cross-Origin Resource Sharing
  app.use(
    cors({
      origin: [env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Middleware: Body Parser
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Middleware: Request Logger
  app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.url}`);
    next();
  });

  // Root endpoint info
  app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
      name: 'CUT&STYLE Salon & Spa API',
      version: '1.0.0',
      status: 'operational',
      docs: '/api/health',
    });
  });

  // Mount API Routes
  app.use('/api', routes);

  // 404 Handler
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
