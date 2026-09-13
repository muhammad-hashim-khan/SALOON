import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';

interface RoleRouteProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles, children }) => {
  const { role, loading } = useAuth();

  if (loading) {
    return null; // Parent ProtectedRoute handles loading display
  }

  if (!role || !allowedRoles.includes(role)) {
    // If worker attempts admin route, redirect to worker billing
    if (role === 'WORKER') {
      return <Navigate to="/worker/billing" replace />;
    }
    // If admin attempts worker route, redirect to admin dashboard
    if (role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
