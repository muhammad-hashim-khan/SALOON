"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = require("./utils/logger");
const createApp = () => {
    const app = (0, express_1.default)();
    // Middleware: Cross-Origin Resource Sharing
    app.use((0, cors_1.default)({
        origin: [env_1.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));
    // Middleware: Body Parser
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    // Middleware: Request Logger
    app.use((req, _res, next) => {
        logger_1.logger.info(`${req.method} ${req.url}`);
        next();
    });
    // Root endpoint info
    app.get('/', (_req, res) => {
        res.status(200).json({
            name: 'CUT&STYLE Salon & Spa API',
            version: '1.0.0',
            status: 'operational',
            docs: '/api/health',
        });
    });
    // Mount API Routes
    app.use('/api', routes_1.default);
    // 404 Handler
    app.use((req, _res, next) => {
        next(new errorHandler_1.AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
    });
    // Global Error Handler
    app.use(errorHandler_1.errorHandler);
    return app;
};
exports.createApp = createApp;
