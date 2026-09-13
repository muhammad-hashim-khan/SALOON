"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const router = (0, express_1.Router)();
// GET /api/auth/me - Authenticated users
router.get('/me', authMiddleware_1.requireAuth, authController_1.getMe);
// GET /api/auth/admin-test - ADMIN role only
router.get('/admin-test', authMiddleware_1.requireAuth, (0, roleMiddleware_1.requireRole)('ADMIN'), authController_1.adminTest);
// GET /api/auth/worker-test - WORKER role only
router.get('/worker-test', authMiddleware_1.requireAuth, (0, roleMiddleware_1.requireRole)('WORKER'), authController_1.workerTest);
exports.default = router;
