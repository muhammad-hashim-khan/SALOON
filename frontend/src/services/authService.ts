import { supabase } from '../lib/supabase';
import { auditService } from './auditService';
import { UserRole, UserStatus } from '../types';

export interface SafeUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
}

export const authService = {
  /**
   * Authenticate with email and password using Supabase
   */
  async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: SafeUser; error?: string }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        return { success: false, error: 'Invalid email or password.' };
      }

      if (!data.user) {
        return { success: false, error: 'Authentication failed.' };
      }

      // Fetch the profile to get role and status
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        return { success: false, error: 'Could not fetch user profile.' };
      }

      if (profile.status === 'INACTIVE') {
        await supabase.auth.signOut();
        return {
          success: false,
          error: 'Your account has been deactivated. Please contact the administrator.',
        };
      }

      const safeUserData: SafeUser = {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        role: profile.role as UserRole,
        status: profile.status as UserStatus,
      };

      // Audit Log
      auditService.logAction(
        safeUserData.id,
        safeUserData.fullName,
        'LOGIN',
        'AUTH',
        null,
        `${safeUserData.role === 'ADMIN' ? 'Admin' : 'Worker'} logged in successfully.`
      );

      return { success: true, user: safeUserData };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed.' };
    }
  },

  /** Sign out */
  async logout(): Promise<void> {
    try {
      const user = await this.getCurrentUserAsync();
      if (user) {
        auditService.logAction(user.id, user.fullName, 'LOGOUT', 'AUTH', null, 'User logged out.');
      }
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Logout error', e);
    }
  },

  /**
   * Fetch the current active user session from Supabase
   */
  async getCurrentUserAsync(): Promise<SafeUser | null> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) return null;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile || profile.status === 'INACTIVE') {
        return null;
      }

      return {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        role: profile.role as UserRole,
        status: profile.status as UserStatus,
      };
    } catch {
      return null;
    }
  },
  
  /** Legacy synchronous getter, mostly disabled now but required by types if not refactored fully */
  getCurrentUser(): SafeUser | null {
    // Cannot block, so return null for sync calls. 
    // AuthContext is refactored to use async.
    return null;
  },

  /** Get available demo credentials for the development login helper (removed in prod DB) */
  getDemoCredentials(): {id: string; email: string; password: string; role: string}[] {
    return [];
  },
};
