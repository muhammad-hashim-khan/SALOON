import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Users,
  WalletCards,
  BarChart3,
  Settings,
  Scissors,
  CreditCard,
  FileSpreadsheet,
  LogOut,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { settingsService } from '../../services/settingsService';

export const Sidebar: React.FC = () => {
  const { profile, role, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === 'ADMIN';
  const settings = settingsService.getSettings();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const adminNavItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Bills & Invoices', path: '/admin/bills', icon: Receipt },
    { label: 'Worker Accounts', path: '/admin/workers', icon: Users },
    { label: 'Expenses', path: '/admin/expenses', icon: WalletCards },
    { label: 'Reports & Analytics', path: '/admin/reports', icon: BarChart3 },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const workerNavItems = [
    { label: 'New Bill', path: '/worker/billing', icon: CreditCard },
    { label: 'My Bills', path: '/worker/bills', icon: FileSpreadsheet },
  ];

  // Strictly enforce navigation based on verified role (Workers never see Admin items)
  const navItems = isAdmin ? adminNavItems : workerNavItems;

  return (
    <aside className="w-64 bg-[#0d0e12] border-r border-white/10 flex flex-col justify-between shrink-0 min-h-screen select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-white/10 bg-[#121318]">
          <div className="w-8 h-8 rounded-lg bg-[#c5a880] text-black flex items-center justify-center font-bold shadow-md shadow-[#c5a880]/20">
            <Scissors className="w-4 h-4 transform -rotate-45" />
          </div>
          <div>
            <span className="font-bold tracking-wider text-sm text-white block leading-none">
              {settings.salonName.substring(0, 3)}<span className="text-[#c5a880]">&</span>{settings.salonName.substring(4) || 'STYLE'}
            </span>
            <span className="text-[10px] text-gray-400 tracking-widest uppercase font-medium mt-0.5 block">
              {settings.businessName}
            </span>
          </div>
        </div>

        {/* Role Badge */}
        <div className="px-6 py-3 border-b border-white/5 bg-[#101116]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
              Portal
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                isAdmin
                  ? 'bg-purple-950/80 text-purple-300 border border-purple-800/40'
                  : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40'
              }`}
            >
              {isAdmin ? <ShieldCheck className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
              {isAdmin ? 'Admin Console' : 'Worker Portal'}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            // "New Bill" uses exact match; "My Bills" matches /worker/bills and /worker/bills/:id
            const isExact = item.path === '/worker/billing' || item.path === '/admin/dashboard';
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={isExact}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-[#c5a880] text-black font-semibold shadow-md shadow-[#c5a880]/15'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Profile & Logout Section */}
      <div className="p-4 border-t border-white/10 bg-[#121318]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#c5a880] to-[#846356] flex items-center justify-center text-black font-bold text-xs shrink-0 shadow-md">
              {profile?.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">
                {profile?.fullName || 'Staff User'}
              </div>
              <div className="text-[10px] text-[#c5a880] font-mono tracking-wide">
                {role || 'STAFF'}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
