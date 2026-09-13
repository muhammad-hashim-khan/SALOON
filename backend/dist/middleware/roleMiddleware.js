"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = void 0;
/**
 * Middleware: Enforce Role-Based Access Control (RBAC).
 * Derives user role strictly from verified database profile on req.user.
 */
const requireRole = (allowedRoles) => {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action',
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
