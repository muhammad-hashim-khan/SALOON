import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { sendError } from '../utils/response';
import { UserRole } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: UserRole;
  };
}

/**
 * Middleware to authenticate requests via Supabase JWT
 */
export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'Authentication required: missing token', 401);
      return;
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      sendError(res, 'Invalid or expired session token', 401);
      return;
    }

    // Attach basic user info to request
    req.user = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch {
    sendError(res, 'Authentication verification failed', 500);
  }
};

/**
 * Middleware to enforce role-based access control (RBAC)
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user || !req.user.id) {
      sendError(res, 'Unauthorized: user not authenticated', 401);
      return;
    }

    // Role will be populated from profile lookup in Phase 2
    if (req.user.role && !allowedRoles.includes(req.user.role)) {
      sendError(res, 'Forbidden: insufficient permissions', 403);
      return;
    }

    next();
  };
};
