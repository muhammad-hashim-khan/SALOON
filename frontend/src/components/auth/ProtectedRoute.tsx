import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Scissors } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090a0d] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-[#c5a880] text-black flex items-center justify-center animate-bounce shadow-lg shadow-[#c5a880]/30 mb-4">
          <Scissors className="w-6 h-6 transform -rotate-45" />
        </div>
        <p className="text-sm text-gray-400 font-medium tracking-wide">
          Verifying credentials...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
