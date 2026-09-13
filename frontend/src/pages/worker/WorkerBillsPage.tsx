import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Receipt, Calendar, Banknote, QrCode, Eye } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { billingService } from '../../services/billingService';
import { MockBill } from '../../types/billing';
import { formatRupeesCompact } from '../../utils/money';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const WorkerBillsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bills, setBills] = useState<MockBill[]>([]);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    const bills = await billingService.getBillsByWorker(user.id);
    setBills(bills);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = bills.filter((b) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      b.billNumber.toLowerCase().includes(q) ||
      b.customerName.toLowerCase().includes(q) ||
      b.customerPhone.includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Bill History</h1>
          <p className="text-sm text-gray-400 mt-0.5">{bills.length} bill{bills.length !== 1 ? 's' : ''} total</p>
        </div>
        <button
          onClick={() => navigate('/worker/billing')}
          className="px-4 py-2 rounded-xl bg-[#c5a880] hover:bg-[#d6be9a] text-black text-sm font-semibold transition-all flex items-center gap-2"
        >
          <Receipt className="w-4 h-4" />
          New Bill
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-3 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by bill number, customer name or phone…"
          className="w-full bg-[#15171e] border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] transition-all"
        />
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500">
          <Receipt className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-lg font-medium text-gray-400">
            {query ? 'No bills match your search' : 'No bills yet'}
          </p>
          {!query && (
            <p className="text-sm mt-1">
              Create your first bill using the <strong className="text-[#c5a880]">New Bill</strong> button above.
            </p>
          )}
        </div>
      )}

      {/* Bill cards */}
      <div className="space-y-3">
        {filtered.map((bill) => (
          <div
            key={bill.id}
            className="bg-[#15171e] border border-white/10 rounded-2xl px-5 py-4 flex items-center gap-4 hover:border-[#c5a880]/40 hover:bg-[#1b1d26] transition-all cursor-pointer group"
            onClick={() => navigate(`/worker/bills/${bill.id}`)}
          >
            {/* Payment Icon */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              bill.paymentMethod === 'CASH'
                ? 'bg-emerald-950/60 text-emerald-400'
                : 'bg-blue-950/60 text-blue-400'
            }`}>
              {bill.paymentMethod === 'CASH' ? (
                <Banknote className="w-5 h-5" />
              ) : (
                <QrCode className="w-5 h-5" />
              )}
            </div>

            {/* Bill info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold font-mono text-[#c5a880]">{bill.billNumber}</span>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  bill.paymentMethod === 'CASH'
                    ? 'bg-emerald-950/80 text-emerald-300'
                    : 'bg-blue-950/80 text-blue-300'
                }`}>
                  {bill.paymentMethod}
                </span>
              </div>
              <p className="text-sm text-white mt-0.5 truncate">
                {bill.customerName || <span className="text-gray-500 italic">Walk-in Customer</span>}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                {formatDate(bill.createdAt)}
                <span className="mx-1">·</span>
                {bill.items.length} item{bill.items.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Total + View */}
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-mono font-bold text-base text-white">
                {formatRupeesCompact(bill.total)}
              </span>
              <Eye className="w-4 h-4 text-gray-600 group-hover:text-[#c5a880] transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
