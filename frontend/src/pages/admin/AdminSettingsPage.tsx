import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, FileText, RotateCcw, Save, KeyRound, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsService, MockSettings } from '../../services/settingsService';
import { auditService } from '../../services/auditService';
import { MockAuditLog } from '../../mock/mockAuditLogs';
import { formatDateTime } from '../../utils/reports/reportFormatters';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

export const AdminSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<MockSettings>({
    salonName: 'CUT&STYLE',
    businessName: 'SALON & SPA',
    phone: '',
    address: ''
  });
  const [logs, setLogs] = useState<MockAuditLog[]>([]);
  const [isResetting, setIsResetting] = useState(false);

  // Admin account fields
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountLoading, setAccountLoading] = useState(false);

  useEffect(() => {
    settingsService.getSettings().then(setSettings);
    auditService.getLogs().then(setLogs);
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await settingsService.saveSettings(settings);
    toast.success('Settings saved successfully!');
    setTimeout(() => window.location.reload(), 1000);
  };

  const handleReset = async () => {
    if (window.confirm('WARNING: Are you sure you want to reset to defaults? This will reset salon settings. This cannot be undone.')) {
      setIsResetting(true);
      await settingsService.resetSettings();
      toast.success('Settings reset to defaults.');
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) { toast.error('Please enter a new email address.'); return; }
    setAccountLoading(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setAccountLoading(false);
    if (error) {
      toast.error(error.message || 'Failed to update email.');
    } else {
      auditService.logAction(user?.id || '', user?.fullName || 'Admin', 'UPDATE_EMAIL', 'AUTH', null, 'Admin email updated.');
      toast.success('Email updated! Check your new email inbox to confirm the change.');
      setNewEmail('');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match.'); return; }
    setAccountLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setAccountLoading(false);
    if (error) {
      toast.error(error.message || 'Failed to update password.');
    } else {
      auditService.logAction(user?.id || '', user?.fullName || 'Admin', 'UPDATE_PASSWORD', 'AUTH', null, 'Admin password updated.');
      toast.success('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-white/10 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Settings</h1>
          <p className="text-sm text-gray-400 mt-1">
            Salon configuration, security controls, and audit trails
          </p>
        </div>
        
        <button 
          onClick={handleReset}
          disabled={isResetting}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-sm font-medium hover:bg-red-500/20 transition-colors border border-red-500/20"
        >
          <RotateCcw className="w-4 h-4" />
          {isResetting ? 'Resetting...' : 'Reset Settings'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Salon Settings + Account Security */}
        <div className="lg:col-span-1 space-y-6">
          {/* Salon Identity Form */}
          <form onSubmit={handleSaveSettings} className="bg-[#15171e] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-[#c5a880]/10 text-[#c5a880]">
                <Settings className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white">Salon Identity</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Salon Name</label>
                <input 
                  type="text"
                  required
                  value={settings.salonName}
                  onChange={e => setSettings({...settings, salonName: e.target.value})}
                  className="w-full bg-[#1b1d26] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#c5a880] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Business Subtitle</label>
                <input 
                  type="text"
                  required
                  value={settings.businessName}
                  onChange={e => setSettings({...settings, businessName: e.target.value})}
                  className="w-full bg-[#1b1d26] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#c5a880] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Contact Phone</label>
                <input 
                  type="text"
                  value={settings.phone}
                  onChange={e => setSettings({...settings, phone: e.target.value})}
                  className="w-full bg-[#1b1d26] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#c5a880] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Address</label>
                <textarea 
                  rows={2}
                  value={settings.address}
                  onChange={e => setSettings({...settings, address: e.target.value})}
                  className="w-full bg-[#1b1d26] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#c5a880] transition-colors"
                />
              </div>
            </div>
            
            <button 
              type="submit"
              className="mt-6 w-full flex justify-center items-center gap-2 py-2.5 rounded-xl font-bold bg-[#c5a880] text-black hover:bg-[#d6be9a] transition-all shadow-[0_0_15px_rgba(197,168,128,0.3)]"
            >
              <Save className="w-4 h-4" /> Save Settings
            </button>
          </form>

          {/* Admin Account Security */}
          <div className="bg-[#15171e] border border-white/10 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white">Admin Account</h2>
            </div>

            {/* Current Email */}
            <div className="text-sm text-gray-400">
              Current email: <span className="text-white font-medium">{user?.email}</span>
            </div>

            {/* Change Email */}
            <form onSubmit={handleUpdateEmail} className="space-y-3">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Change Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  placeholder="New email address"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full bg-[#1b1d26] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:border-[#c5a880] transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={accountLoading}
                className="w-full py-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/20 hover:bg-blue-600/30 text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {accountLoading ? 'Updating...' : 'Update Email'}
              </button>
            </form>

            {/* Change Password */}
            <form onSubmit={handleUpdatePassword} className="space-y-3">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Change Password</label>
              <input
                type="password"
                placeholder="New password (min 6 chars)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full bg-[#1b1d26] border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#c5a880] transition-colors"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full bg-[#1b1d26] border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#c5a880] transition-colors"
              />
              <button
                type="submit"
                disabled={accountLoading}
                className="w-full py-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600/30 text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {accountLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>

        {/* Audit Log */}
        <div className="lg:col-span-2">
          <div className="bg-[#15171e] border border-white/10 rounded-2xl overflow-hidden h-[600px] flex flex-col">
            <div className="p-6 border-b border-white/5 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Recent Activity</h2>
                <p className="text-xs text-gray-400">Security audit log</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-0">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
                  <FileText className="w-12 h-12 mb-3 opacity-20" />
                  <p>No audit logs found.</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#1b1d26] text-gray-400 border-b border-white/5 sticky top-0">
                    <tr>
                      <th className="px-5 py-3 font-medium">Date</th>
                      <th className="px-5 py-3 font-medium">User</th>
                      <th className="px-5 py-3 font-medium">Action</th>
                      <th className="px-5 py-3 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {logs.map(log => (
                      <tr key={log.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-3 text-gray-400">{formatDateTime(log.createdAt)}</td>
                        <td className="px-5 py-3 text-white">{log.userName}</td>
                        <td className="px-5 py-3">
                          <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-gray-300 border border-white/5">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-400 max-w-[200px] truncate">{log.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
