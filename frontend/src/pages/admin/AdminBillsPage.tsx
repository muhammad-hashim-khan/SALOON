import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Receipt, Eye, Banknote, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { billingService } from '../../services/billingService';
import { workerService } from '../../services/workerService';
import { MockBill } from '../../types/billing';
import { formatRupeesCompact } from '../../utils/money';
import { getStartOf, getEndOf, DateRange } from '../../utils/analytics';

type FilterDate = 'all' | 'today' | 'yesterday' | '7days' | 'month';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const AdminBillsPage: React.FC = () => {
  const navigate = useNavigate();
  const [bills, setBills] = useState<MockBill[]>([]);
  const [workers, setWorkers] = useState<{id: string; name: string}[]>([]);

  // Search & Filters
  const [query, setQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<FilterDate>('all');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'CASH' | 'UPI'>('ALL');
  const [workerFilter, setWorkerFilter] = useState<string>('ALL');

  useEffect(() => {
    const loadData = async () => {
      const [allBills, allWorkers] = await Promise.all([
        billingService.getBills(),
        workerService.getWorkers()
      ]);
      setBills(allBills);
      setWorkers(allWorkers.map(w => ({ id: w.id, name: w.fullName })));
    };
    loadData();
  }, []);

  const filteredBills = useMemo(() => {
    let result = bills;

    // Search
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        b =>
          b.billNumber.toLowerCase().includes(q) ||
          b.customerName.toLowerCase().includes(q) ||
          b.customerPhone.includes(q) ||
          b.workerName.toLowerCase().includes(q)
      );
    }

    // Date Filter
    if (dateFilter !== 'all') {
      const start = getStartOf(dateFilter as DateRange).getTime();
      const end = getEndOf(dateFilter as DateRange).getTime();
      result = result.filter(b => {
        const t = new Date(b.createdAt).getTime();
        return t >= start && t <= end;
      });
    }

    // Payment Filter
    if (paymentFilter !== 'ALL') {
      result = result.filter(b => b.paymentMethod === paymentFilter);
    }

    // Worker Filter
    if (workerFilter !== 'ALL') {
      result = result.filter(b => b.workerId === workerFilter);
    }

    // Sort newest first
    return result.sort((a, b) => new Date(b.createdAt).getTime() < new Date(a.createdAt).getTime() ? 1 : -1);
  }, [bills, query, dateFilter, paymentFilter, workerFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Bills & Invoices</h1>
          <p className="text-sm text-gray-400 mt-1">
            Complete billing records across all salon workers
          </p>
        </div>
      </div>

      {/* Filters Area */}
      <div className="bg-[#15171e] border border-white/10 rounded-2xl p-4 flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Bill #, Customer, Phone, or Worker..."
            className="w-full bg-[#1b1d26] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] transition-all"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#1b1d26] border border-white/10 rounded-xl px-3 py-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as FilterDate)}
              className="bg-transparent text-sm text-gray-300 focus:outline-none"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7days">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-[#1b1d26] border border-white/10 rounded-xl px-3 py-2">
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="bg-transparent text-sm text-gray-300 focus:outline-none"
            >
              <option value="ALL">All Payments</option>
              <option value="CASH">Cash Only</option>
              <option value="UPI">UPI Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-[#1b1d26] border border-white/10 rounded-xl px-3 py-2">
            <select
              value={workerFilter}
              onChange={(e) => setWorkerFilter(e.target.value)}
              className="bg-transparent text-sm text-gray-300 focus:outline-none max-w-[150px] truncate"
            >
              <option value="ALL">All Workers</option>
              {workers.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-[#15171e] border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#1b1d26] text-gray-400">
              <tr>
                <th className="px-6 py-4 font-medium">Bill Number</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Worker</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
                <th className="px-6 py-4 font-medium text-center">Payment</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Receipt className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500">No bills found.</p>
                    {(query || dateFilter !== 'all' || paymentFilter !== 'ALL' || workerFilter !== 'ALL') && (
                      <button onClick={() => { setQuery(''); setDateFilter('all'); setPaymentFilter('ALL'); setWorkerFilter('ALL'); }} className="mt-3 text-[#c5a880] hover:underline text-sm font-medium">
                        Clear Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-[#c5a880] font-mono text-sm">{bill.billNumber}</td>
                    <td className="px-6 py-4 text-gray-400 text-xs">{formatDate(bill.createdAt)}</td>
                    <td className="px-6 py-4 text-white">
                      {bill.customerName || <span className="italic text-gray-500">Walk-in</span>}
                      {bill.customerPhone && <span className="block text-xs text-gray-500 mt-0.5">{bill.customerPhone}</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-300">{bill.workerName}</td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-white">{formatRupeesCompact(bill.total)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        bill.paymentMethod === 'CASH'
                          ? 'bg-emerald-950/60 text-emerald-400'
                          : 'bg-blue-950/60 text-blue-400'
                      }`}>
                        {bill.paymentMethod === 'CASH' ? <Banknote className="w-3 h-3" /> : <QrCode className="w-3 h-3" />}
                        {bill.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/admin/bills/${bill.id}`)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-gray-300 hover:text-white transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
