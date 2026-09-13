import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, SafeUser } from '../services/authService';
import { UserRole } from '../types';
import { supabase } from '../lib/supabase';

export interface AuthContextType {
  user: SafeUser | null;
  profile: SafeUser | null;
  role: UserRole | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize and restore session on app load
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      const sessionUser = await authService.getCurrentUserAsync();
      if (mounted) {
        if (sessionUser && sessionUser.status === 'ACTIVE') {
          setUser(sessionUser);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, _session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        const sessionUser = await authService.getCurrentUserAsync();
        if (mounted) {
          setUser(sessionUser?.status === 'ACTIVE' ? sessionUser : null);
        }
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  /**
   * Handle user login
   */
  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; role?: UserRole; error?: string }> => {
    setLoading(true);
    try {
      const result = await authService.login(email, password);

      if (result.success && result.user) {
        setUser(result.user);
        return { success: true, role: result.user.role };
      }

      return {
        success: false,
        error: result.error || 'Invalid email or password.',
      };
    } catch {
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle user logout
   */
  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  const role: UserRole | null = user?.role || null;
  const isAuthenticated: boolean = !!user && user.status === 'ACTIVE';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile: user,
        role,
        loading,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
