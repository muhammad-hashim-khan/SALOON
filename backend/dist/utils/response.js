"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, data, message, statusCode = 200) => {
    const responseBody = {
        success: true,
        ...(message ? { message } : {}),
        ...(data !== undefined ? { data } : {}),
    };
    return res.status(statusCode).json(responseBody);
};
exports.sendSuccess = sendSuccess;
const sendError = (res, error, statusCode = 400) => {
    const responseBody = {
        success: false,
        error,
    };
    return res.status(statusCode).json(responseBody);
};
exports.sendError = sendError;
