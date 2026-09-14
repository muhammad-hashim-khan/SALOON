import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onMenuClick }) => {
  const { profile, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="h-16 border-b border-white/10 bg-[#121318]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button 
            onClick={onMenuClick}
            className="p-2 -ml-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 md:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-lg font-semibold text-white tracking-wide">{title || 'CUT&STYLE'}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* User Profile Capsule */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-white">{profile?.fullName || 'Staff User'}</div>
            <div className="text-[10px] text-[#c5a880] font-mono font-medium tracking-wide">
              {role || 'ACTIVE'}
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#c5a880] to-[#846356] flex items-center justify-center text-black font-bold text-xs shadow-md">
            {profile?.fullName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
