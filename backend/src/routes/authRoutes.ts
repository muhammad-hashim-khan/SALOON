import { Router } from 'express';
import { getMe, adminTest, workerTest } from '../controllers/authController';
import { requireAuth } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';

const router = Router();

// GET /api/auth/me - Authenticated users
router.get('/me', requireAuth, getMe);

// GET /api/auth/admin-test - ADMIN role only
router.get('/admin-test', requireAuth, requireRole('ADMIN'), adminTest);

// GET /api/auth/worker-test - WORKER role only
router.get('/worker-test', requireAuth, requireRole('WORKER'), workerTest);

export default router;
