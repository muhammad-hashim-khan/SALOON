"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
const app = (0, app_1.createApp)();
const PORT = parseInt(env_1.env.PORT, 10) || 5000;
const server = app.listen(PORT, () => {
    logger_1.logger.info(`=================================================`);
    logger_1.logger.info(` CUT&STYLE Salon & Spa API Server`);
    logger_1.logger.info(` Port:        ${PORT}`);
    logger_1.logger.info(` Environment: ${env_1.env.NODE_ENV}`);
    logger_1.logger.info(` Health Check: http://localhost:${PORT}/api/health`);
    logger_1.logger.info(`=================================================`);
});
// Handle graceful shutdown
const gracefulShutdown = (signal) => {
    logger_1.logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
        logger_1.logger.info('HTTP server closed.');
        process.exit(0);
    });
    setTimeout(() => {
        logger_1.logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 5000);
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
