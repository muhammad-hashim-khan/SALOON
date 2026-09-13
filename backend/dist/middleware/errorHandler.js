"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (err, _req, res, _next) => {
    logger_1.logger.error('Unhandled error:', err);
    if (err instanceof AppError) {
        (0, response_1.sendError)(res, err.message, err.statusCode);
        return;
    }
    const statusCode = 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'An unexpected internal server error occurred'
        : err.message || 'Internal Server Error';
    (0, response_1.sendError)(res, message, statusCode);
};
exports.errorHandler = errorHandler;
