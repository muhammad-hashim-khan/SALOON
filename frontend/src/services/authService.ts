/**
 * Authentication Service (DEVELOPMENT ONLY MOCK LAYER)
 *
 * Provides an abstracted interface for authentication operations.
 * When Supabase Auth is integrated in a later phase, only this service
 * will be swapped with the Supabase client without requiring UI redesigns.
 *
 * Now delegates user lookup to workerService so dynamically created /
 * deactivated workers are respected at login time.
 */

import { workerService } from './workerService';
import { auditService } from './auditService';
import { UserRole, UserStatus } from '../types';

export interface SafeUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
}

const SESSION_STORAGE_KEY = 'cutandstyle_mock_session';

export const authService = {
  /**
   * Authenticate with email and password.
   * Looks up the live user record (includes dynamically created workers).
   */
  async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: SafeUser; error?: string }> {
    // Simulate slight network latency for realistic UI feedback
    await new Promise((resolve) => setTimeout(resolve, 350));

    const foundUser = workerService.getUserForAuth(email.trim().toLowerCase());

    if (!foundUser || foundUser.password !== password) {
      return { success: false, error: 'Invalid email or password.' };
    }

    if (foundUser.status === 'INACTIVE') {
      return {
        success: false,
        error: 'Your account has been deactivated. Please contact the administrator.',
      };
    }

    const safeUserData: SafeUser = {
      id: foundUser.id,
      email: foundUser.email,
      fullName: foundUser.fullName,
      role: foundUser.role,
      status: foundUser.status,
    };

    // Store safe user data in localStorage (no passwords)
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(safeUserData));
    
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
  },

  /** Sign out and clear stored session */
  async logout(): Promise<void> {
    const user = this.getCurrentUser();
    if (user) {
      auditService.logAction(user.id, user.fullName, 'LOGOUT', 'AUTH', null, 'User logged out.');
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
    localStorage.removeItem(SESSION_STORAGE_KEY);
  },

  /**
   * Restore the currently active session from localStorage.
   * Re-validates against live worker store so deactivations take immediate effect.
   */
  getCurrentUser(): SafeUser | null {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored) as SafeUser;

      // Re-check live status — catches admin deactivating a logged-in worker
      const live = workerService.getById(parsed.id);
      if (!live || live.status === 'INACTIVE') {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
      }

      return parsed;
    } catch {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
  },

  /** Get available demo credentials for the development login helper */
  getDemoCredentials() {
    return workerService
      .getAllUsers()
      .filter((u) => u.status === 'ACTIVE')
      .slice(0, 3) // only show first 3 in helper
      .map(({ id, email, password, fullName, role }) => ({
        id,
        email,
        password,
        fullName,
        role,
      }));
  },
};
