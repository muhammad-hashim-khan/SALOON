import React, { useState, useEffect } from 'react';
import { UserPlus, ShieldAlert, CheckCircle2, XCircle, ArrowLeft, Eye, X, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { workerService, WorkerRecord } from '../../services/workerService';
import { billingService } from '../../services/billingService';
import { auditService } from '../../services/auditService';
import { useAuth } from '../../hooks/useAuth';
import { calcWorkerPerformance, WorkerPerf } from '../../utils/analytics';
import { formatRupeesCompact } from '../../utils/money';
import { MockBill } from '../../types/billing';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export const AdminWorkersPage: React.FC = () => {
  const { user } = useAuth();
  const [workers, setWorkers] = useState<WorkerRecord[]>([]);
  const [allBills, setAllBills] = useState<MockBill[]>([]);
  const [perfMap, setPerfMap] = useState<Map<string, WorkerPerf>>(new Map());

  // UI State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<WorkerRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirm Dialog State
  const [confirmTarget, setConfirmTarget] = useState<WorkerRecord | null>(null);

  // Form State
  const [createForm, setCreateForm] = useState({ fullName: '', email: '', password: '' });
  const [createError, setCreateError] = useState('');

  const loadData = async () => {
    const wList = await workerService.getWorkers();
    const bList = await billingService.getBills();
    const wPerf = calcWorkerPerformance(bList);
    const pMap = new Map(wPerf.map(p => [p.workerId, p]));

    setWorkers(wList);
    setAllBills(bList);
    setPerfMap(pMap);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = (worker: WorkerRecord) => {
    setConfirmTarget(worker);
  };

  const executeToggle = async () => {
    if (!confirmTarget) return;
    const newStatus = confirmTarget.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await workerService.updateStatus(confirmTarget.id, newStatus);

    const action = newStatus === 'INACTIVE' ? 'DEACTIVATE_WORKER' : 'ACTIVATE_WORKER';
    auditService.logAction(
      user?.id || 'admin',
      user?.fullName || 'Admin',
      action,
      'WORKER',
      confirmTarget.id,
      `${newStatus === 'INACTIVE' ? 'Deactivated' : 'Activated'} worker: ${confirmTarget.fullName}`
    );

    toast.success(`${confirmTarget.fullName} has been ${newStatus === 'INACTIVE' ? 'deactivated' : 'activated'}.`);

    loadData();
    if (selectedWorker && selectedWorker.id === confirmTarget.id) {
      setSelectedWorker({ ...selectedWorker, status: newStatus });
    }
    setConfirmTarget(null);
  };

  const validateCreateForm = (): string | null => {
    if (!createForm.fullName.trim() || createForm.fullName.trim().length < 2) {
      return 'Full Name must be at least 2 characters.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(createForm.email.trim())) {
      return 'Please enter a valid email address.';
    }
    if (createForm.password.length < 8) {
      return 'Password must be at least 8 characters.';
    }
    return null;
  };

  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    const validationError = validateCreateForm();
    if (validationError) {
      setCreateError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await workerService.createWorker(createForm);
      if (!res.success) {
        setCreateError(res.error || 'Failed to create worker.');
        setIsSubmitting(false);
        return;
      }

      auditService.logAction(
        user?.id || 'admin',
        user?.fullName || 'Admin',
        'CREATE_WORKER',
        'WORKER',
        res.worker?.id || null,
        `Created worker: ${createForm.fullName} (${createForm.email})`
      );

      toast.success('Worker created successfully.');
      setCreateForm({ fullName: '', email: '', password: '' });
      setIsCreateOpen(false);
      setIsSubmitting(false);
      loadData();
    } catch (err: any) {
      setCreateError(err.message || 'An unexpected error occurred.');
      setIsSubmitting(false);
    }
  };

  // ── Worker Details View ──
  if (selectedWorker) {
    const perf = perfMap.get(selectedWorker.id) || { totalBills: 0, totalSales: 0, cashSales: 0, upiSales: 0, workerId: '', workerName: '' };
    const recentBills = allBills.filter(b => b.workerId === selectedWorker.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);

    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedWorker(null)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-medium text-gray-300 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Workers
        </button>

        <div className="bg-[#15171e] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">{selectedWorker.fullName}</h2>
              <p className="text-sm text-gray-400 mt-1">{selectedWorker.email}</p>
            </div>
            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full ${selectedWorker.status === 'ACTIVE' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800' : 'bg-red-950/80 text-red-400 border border-red-800'}`}>
              {selectedWorker.status}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 bg-[#1b1d26] rounded-xl border border-white/5">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Sales</div>
              <div className="text-xl font-bold text-white font-mono">{formatRupeesCompact(perf.totalSales)}</div>
            </div>
            <div className="p-4 bg-[#1b1d26] rounded-xl border border-white/5">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Bills</div>
              <div className="text-xl font-bold text-white font-mono">{perf.totalBills}</div>
            </div>
            <div className="p-4 bg-[#1b1d26] rounded-xl border border-white/5">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Cash Sales</div>
              <div className="text-xl font-bold text-white font-mono">{formatRupeesCompact(perf.cashSales)}</div>
            </div>
            <div className="p-4 bg-[#1b1d26] rounded-xl border border-white/5">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">UPI Sales</div>
              <div className="text-xl font-bold text-white font-mono">{formatRupeesCompact(perf.upiSales)}</div>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-white mb-4">Recent Bills</h3>
          {recentBills.length === 0 ? (
            <p className="text-gray-500 text-sm">No bills generated yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#1b1d26] text-gray-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Bill No</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Payment</th>
                    <th className="px-4 py-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentBills.map(b => (
                    <tr key={b.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-[#c5a880] font-mono">{b.billNumber}</td>
                      <td className="px-4 py-3 text-gray-400">{formatDate(b.createdAt)}</td>
                      <td className="px-4 py-3 text-white">{b.customerName || <span className="text-gray-500 italic">Walk-in</span>}</td>
                      <td className="px-4 py-3 text-gray-300">{b.paymentMethod}</td>
                      <td className="px-4 py-3 text-right font-mono text-white font-bold">{formatRupeesCompact(b.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Main List View ──
  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Worker Accounts</h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage salon staff, access credentials, and view sales performance
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#c5a880] hover:bg-[#d6be9a] text-black font-semibold text-sm transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Create Worker
        </button>
      </div>

      <div className="bg-[#15171e] border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#1b1d26] text-gray-400">
              <tr>
                <th className="px-6 py-4 font-medium">Worker</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Bills</th>
                <th className="px-6 py-4 font-medium text-right">Total Sales</th>
                <th className="px-6 py-4 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {workers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500">No workers found. Create one to get started.</p>
                    <button onClick={() => setIsCreateOpen(true)} className="mt-3 text-[#c5a880] hover:underline text-sm font-medium">
                      Create Worker
                    </button>
                  </td>
                </tr>
              ) : (
                workers.map(w => {
                  const perf = perfMap.get(w.id);
                  return (
                    <tr key={w.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 text-white font-medium cursor-pointer hover:text-[#c5a880]" onClick={() => setSelectedWorker(w)}>
                        {w.fullName}
                      </td>
                      <td className="px-6 py-4 text-gray-400">{w.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                          w.status === 'ACTIVE' ? 'bg-emerald-950/60 text-emerald-400' : 'bg-red-950/60 text-red-400'
                        }`}>
                          {w.status === 'ACTIVE' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {w.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{perf ? perf.totalBills : 0}</td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-[#c5a880]">{formatRupeesCompact(perf ? perf.totalSales : 0)}</td>
                      <td className="px-6 py-4 flex items-center justify-center gap-3">
                        <button
                          onClick={() => setSelectedWorker(w)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                          title="View Details"
                          aria-label={`View details for ${w.fullName}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(w)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            w.status === 'ACTIVE' 
                            ? 'bg-red-950/30 hover:bg-red-950/80 text-red-400' 
                            : 'bg-emerald-950/30 hover:bg-emerald-950/80 text-emerald-400'
                          }`}
                          title={w.status === 'ACTIVE' ? 'Deactivate Worker' : 'Activate Worker'}
                          aria-label={`${w.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} ${w.fullName}`}
                        >
                          {w.status === 'ACTIVE' ? <ShieldAlert className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Worker Modal Overlay */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
          <div className="bg-[#15171e] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-lg font-bold text-white">Create Worker Account</h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-white" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateWorker} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {createError}
                </div>
              )}
              
              <div>
                <label htmlFor="workerName" className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Full Name <span className="text-red-400">*</span></label>
                <input
                  id="workerName"
                  type="text"
                  required
                  minLength={2}
                  value={createForm.fullName}
                  onChange={e => setCreateForm({...createForm, fullName: e.target.value})}
                  className="w-full bg-[#1b1d26] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] outline-none"
                  placeholder="e.g. Rahul Sharma"
                />
              </div>

              <div>
                <label htmlFor="workerEmail" className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Email Address <span className="text-red-400">*</span></label>
                <input
                  id="workerEmail"
                  type="email"
                  required
                  value={createForm.email}
                  onChange={e => setCreateForm({...createForm, email: e.target.value})}
                  className="w-full bg-[#1b1d26] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] outline-none"
                  placeholder="worker@cutandstyle.com"
                />
              </div>

              <div>
                <label htmlFor="workerPassword" className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Password <span className="text-red-400">*</span></label>
                <input
                  id="workerPassword"
                  type="text"
                  required
                  minLength={8}
                  value={createForm.password}
                  onChange={e => setCreateForm({...createForm, password: e.target.value})}
                  className="w-full bg-[#1b1d26] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] outline-none"
                  placeholder="Minimum 8 characters"
                />
                <p className="text-[10px] text-gray-500 mt-1">For development, this password will be visible to you.</p>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-[#c5a880] hover:bg-[#d6be9a] text-black font-bold text-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Deactivation / Activation Dialog */}
      <ConfirmDialog
        isOpen={!!confirmTarget}
        title={confirmTarget?.status === 'ACTIVE' ? 'Deactivate Worker?' : 'Activate Worker?'}
        message={
          confirmTarget?.status === 'ACTIVE'
            ? `Are you sure you want to deactivate ${confirmTarget?.fullName}? They will no longer be able to log in.`
            : `Are you sure you want to activate ${confirmTarget?.fullName}? They will be able to log in again.`
        }
        confirmLabel={confirmTarget?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        variant={confirmTarget?.status === 'ACTIVE' ? 'danger' : 'warning'}
        onConfirm={executeToggle}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
};
