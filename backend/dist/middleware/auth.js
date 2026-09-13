"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requireAuth = void 0;
const supabase_1 = require("../config/supabase");
const response_1 = require("../utils/response");
/**
 * Middleware to authenticate requests via Supabase JWT
 */
const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            (0, response_1.sendError)(res, 'Authentication required: missing token', 401);
            return;
        }
        const token = authHeader.split(' ')[1];
        const { data: { user }, error } = await supabase_1.supabase.auth.getUser(token);
        if (error || !user) {
            (0, response_1.sendError)(res, 'Invalid or expired session token', 401);
            return;
        }
        // Attach basic user info to request
        req.user = {
            id: user.id,
            email: user.email,
        };
        next();
    }
    catch {
        (0, response_1.sendError)(res, 'Authentication verification failed', 500);
    }
};
exports.requireAuth = requireAuth;
/**
 * Middleware to enforce role-based access control (RBAC)
 */
const requireRole = (allowedRoles) => {
    return async (req, res, next) => {
        if (!req.user || !req.user.id) {
            (0, response_1.sendError)(res, 'Unauthorized: user not authenticated', 401);
            return;
        }
        // Role will be populated from profile lookup in Phase 2
        if (req.user.role && !allowedRoles.includes(req.user.role)) {
            (0, response_1.sendError)(res, 'Forbidden: insufficient permissions', 403);
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
