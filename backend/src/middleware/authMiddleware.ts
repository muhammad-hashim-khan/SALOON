import { Request, Response, NextFunction } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
import { AuthenticatedUser, Profile } from '../types';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Middleware: Verify Supabase JWT token and populate user profile from database.
 * Blocks unauthenticated requests and deactivated accounts.
 */
export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // 1. Verify token with Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      logger.warn('Token validation failed:', authError?.message || 'No user returned');
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // 2. Retrieve user profile directly from the database (never trust client-supplied role)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, role, status')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      logger.warn(`Profile not found for authenticated user ${user.id}:`, profileError?.message);
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const userProfile = profile as Profile;

    // 3. Check if account is ACTIVE
    if (userProfile.status !== 'ACTIVE') {
      res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact the administrator.',
      });
      return;
    }

    // 4. Attach verified profile to request
    req.user = {
      id: user.id,
      email: user.email,
      fullName: userProfile.full_name,
      role: userProfile.role,
      status: userProfile.status,
    };

    next();
  } catch (err) {
    logger.error('Unexpected error in requireAuth middleware:', err);
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }
};
