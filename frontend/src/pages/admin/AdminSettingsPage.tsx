import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, FileText, RotateCcw, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsService, MockSettings } from '../../services/settingsService';
import { auditService } from '../../services/auditService';
import { MockAuditLog } from '../../mock/mockAuditLogs';
import { formatDateTime } from '../../utils/reports/reportFormatters';

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<MockSettings>(settingsService.getSettings());
  const [logs, setLogs] = useState<MockAuditLog[]>([]);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    setLogs(auditService.getLogs());
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    settingsService.saveSettings(settings);
    toast.success('Settings saved successfully!');
    // Ideally we would use context for settings, but for mock, reload or manual sync works
    // A quick reload ensures the UI picks up the new name everywhere (sidebar, dashboard).
    setTimeout(() => window.location.reload(), 1000);
  };

  const handleReset = () => {
    if (window.confirm('WARNING: Are you sure you want to reset all mock data? This will clear Bills, Expenses, Workers (except defaults), Settings, and Audit Logs. This action cannot be undone.')) {
      setIsResetting(true);
      
      // Clear local storage completely except maybe we just want to clear specific keys
      localStorage.removeItem('cutandstyle_mock_bills');
      localStorage.removeItem('cutandstyle_mock_expenses');
      localStorage.removeItem('cutandstyle_mock_users');
      localStorage.removeItem('cutandstyle_mock_audit_logs');
      localStorage.removeItem('cutandstyle_mock_settings');
      localStorage.removeItem('cutandstyle_mock_session');
      
      toast.success('Demo data reset successfully.');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
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
        
        {/* DEVELOPMENT ONLY */}
        <button 
          onClick={handleReset}
          disabled={isResetting}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-sm font-medium hover:bg-red-500/20 transition-colors border border-red-500/20"
        >
          <RotateCcw className="w-4 h-4" />
          {isResetting ? 'Resetting...' : 'Reset Demo Data'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-1">
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
