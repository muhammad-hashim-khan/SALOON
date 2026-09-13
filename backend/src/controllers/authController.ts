import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

/**
 * GET /api/auth/me
 * Returns current authenticated user profile
 */
export const getMe = (req: AuthenticatedRequest, res: Response): void => {
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

/**
 * GET /api/auth/admin-test
 * ADMIN only test endpoint
 */
export const adminTest = (_req: AuthenticatedRequest, res: Response): void => {
  res.status(200).json({
    success: true,
    message: 'Admin authorization successful',
  });
};

/**
 * GET /api/auth/worker-test
 * WORKER only test endpoint
 */
export const workerTest = (_req: AuthenticatedRequest, res: Response): void => {
  res.status(200).json({
    success: true,
    message: 'Worker authorization successful',
  });
};
