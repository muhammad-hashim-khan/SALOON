import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const app = createApp();
const PORT = parseInt(env.PORT, 10) || 5000;

const server = app.listen(PORT, () => {
  logger.info(`=================================================`);
  logger.info(` CUT&STYLE Salon & Spa API Server`);
  logger.info(` Port:        ${PORT}`);
  logger.info(` Environment: ${env.NODE_ENV}`);
  logger.info(` Health Check: http://localhost:${PORT}/api/health`);
  logger.info(`=================================================`);
});

// Handle graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 5000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
