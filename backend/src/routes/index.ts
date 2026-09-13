import { Router } from 'express';
import healthRoutes from './healthRoutes';
import authRoutes from './authRoutes';

const router = Router();

// Mount health route
router.use('/', healthRoutes);

// Mount auth and RBAC routes
router.use('/auth', authRoutes);

export default router;
