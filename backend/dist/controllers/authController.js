"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workerTest = exports.adminTest = exports.getMe = void 0;
/**
 * GET /api/auth/me
 * Returns current authenticated user profile
 */
const getMe = (req, res) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required',
        });
        return;
    }
    res.status(200).json({
        success: true,
        user: {
            id: req.user.id,
            email: req.user.email || '',
            fullName: req.user.fullName,
            role: req.user.role,
        },
    });
};
exports.getMe = getMe;
/**
 * GET /api/auth/admin-test
 * ADMIN only test endpoint
 */
const adminTest = (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'Admin authorization successful',
    });
};
exports.adminTest = adminTest;
/**
 * GET /api/auth/worker-test
 * WORKER only test endpoint
 */
const workerTest = (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'Worker authorization successful',
    });
};
exports.workerTest = workerTest;
