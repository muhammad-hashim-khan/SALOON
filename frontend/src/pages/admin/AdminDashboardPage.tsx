import React, { useState, useMemo, useEffect } from 'react';
import { TrendingUp, ArrowRight, Banknote, QrCode, TrendingDown, WalletCards, PieChart as PieChartIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { billingService } from '../../services/billingService';
import { expenseService } from '../../services/expenseService';
import { MockBill } from '../../types/billing';
import { MockExpense } from '../../types/expense';
import { formatRupeesCompact } from '../../utils/money';
import {
  DateRange,
  filterByRange,
  filterExpensesByRange,
  calcStats,
  calcExpenseStats,
  calcCategoryBreakdown,
  buildChartData,
  calcWorkerPerformance,
} from '../../utils/analytics';

const RANGES: { value: DateRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7days', label: 'Last 7 Days' },
  { value: 'month', label: 'This Month' },
];

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState<DateRange>('7days');
  const [allBills, setAllBills] = useState<MockBill[]>([]);
  const [allExpenses, setAllExpenses] = useState<MockExpense[]>([]);

  useEffect(() => {
    setAllBills(billingService.getBills());
    setAllExpenses(expenseService.getExpenses());
  }, []);

  const { stats, expStats, chartData, workerPerf, topCategories, monthSummary } = useMemo(() => {
    // Current Period
    const fBills = filterByRange(allBills, range);
    const fExpenses = filterExpensesByRange(allExpenses, range);
    const s = calcStats(fBills);
    const e = calcExpenseStats(fExpenses);
    
    const cData = buildChartData(allBills, allExpenses, range === 'month' ? 'month' : '7days');
    const wPerf = calcWorkerPerformance(fBills);
    const tCats = calcCategoryBreakdown(fExpenses).slice(0, 3);

    // This Month Summary (independent of range filter)
    const monthBills = filterByRange(allBills, 'month');
    const monthExpenses = filterExpensesByRange(allExpenses, 'month');
    const mSales = calcStats(monthBills).totalSales;
    const mExp = calcExpenseStats(monthExpenses).totalExpenses;

    return { 
      stats: s, 
      expStats: e, 
      chartData: cData, 
      workerPerf: wPerf, 
      topCategories: tCats,
      monthSummary: { sales: mSales, expenses: mExp, net: mSales - mExp }
    };
  }, [allBills, allExpenses, range]);

  const cashPercent = stats.totalSales > 0 ? Math.round((stats.cashSales / stats.totalSales) * 100) : 0;
  const upiPercent = stats.totalSales > 0 ? 100 - cashPercent : 0;
  const netAmount = stats.totalSales - expStats.totalExpenses;

  return (
    <div className="space-y-6">
      {/* Top Header & Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Admin Overview</h1>
          <p className="text-sm text-gray-400 mt-1">
            Real-time salon operations and sales velocity
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#15171e] p-1 rounded-xl border border-white/10">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                range === r.value
                  ? 'bg-[#c5a880] text-black shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Sales */}
        <div className="bg-[#15171e] border border-white/10 rounded-2xl p-5 hover:border-[#c5a880]/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Sales</span>
            <div className="p-2 rounded-lg bg-[#c5a880]/10 text-[#c5a880]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">{formatRupeesCompact(stats.totalSales)}</div>
          <div className="mt-1 text-[11px] text-gray-500">Based on {range}</div>
        </div>

        {/* Total Expenses */}
        <div className="bg-[#15171e] border border-white/10 rounded-2xl p-5 hover:border-red-500/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Expenses</span>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">{formatRupeesCompact(expStats.totalExpenses)}</div>
          <div className="mt-1 text-[11px] text-gray-500">Based on {range}</div>
        </div>

        {/* Net Amount */}
        <div className="bg-[#15171e] border border-white/10 rounded-2xl p-5 hover:border-emerald-500/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Estimated Net</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <WalletCards className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">{formatRupeesCompact(netAmount)}</div>
          <div className="mt-1 text-[11px] text-gray-500">Sales minus Expenses</div>
        </div>
      </div>

      {/* Charts & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales vs Expenses Chart */}
        <div className="lg:col-span-2 bg-[#15171e] border border-white/10 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white mb-6">Sales vs Expenses ({range === 'month' ? 'This Month' : 'Last 7 Days'})</h2>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c5a880" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#c5a880" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/100}`} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#1b1d26', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ fontWeight: 'bold' }}
                  labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
                  formatter={(val: number, name: string) => [formatRupeesCompact(val), name === 'sales' ? 'Sales' : 'Expenses']}
                />
                <Area type="monotone" dataKey="sales" stroke="#c5a880" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpenses)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          {/* Monthly Financial Summary */}
          <div className="bg-[#15171e] border border-white/10 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-white mb-4">Monthly Financial Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Sales</span>
                <span className="font-bold text-white">{formatRupeesCompact(monthSummary.sales)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Expenses</span>
                <span className="font-bold text-red-400">{formatRupeesCompact(monthSummary.expenses)}</span>
              </div>
              <div className="pt-3 border-t border-white/10 flex justify-between items-center text-sm">
                <span className="text-gray-400">Estimated Net</span>
                <span className="font-bold text-[#c5a880]">{formatRupeesCompact(monthSummary.net)}</span>
              </div>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="bg-[#15171e] border border-white/10 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-white mb-4">Payment Breakdown (Sales)</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Banknote className="w-4 h-4" />
                  <span>Cash</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-white">{formatRupeesCompact(stats.cashSales)}</div>
                  <div className="text-xs text-gray-500">{cashPercent}%</div>
                </div>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${cashPercent}%` }}></div>
              </div>
              
              <div className="flex justify-between items-center text-sm pt-2">
                <div className="flex items-center gap-2 text-indigo-400">
                  <QrCode className="w-4 h-4" />
                  <span>UPI</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-white">{formatRupeesCompact(stats.upiSales)}</div>
                  <div className="text-xs text-gray-500">{upiPercent}%</div>
                </div>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${upiPercent}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Worker Performance */}
        <div className="bg-[#15171e] border border-white/10 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-5 border-b border-white/5 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-white">Worker Performance</h2>
          </div>
          <div className="p-0 flex-1 overflow-auto">
            {workerPerf.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No data for selected period.</div>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#1b1d26] text-gray-400">
                  <tr>
                    <th className="px-5 py-3 font-medium">Worker</th>
                    <th className="px-5 py-3 font-medium">Bills</th>
                    <th className="px-5 py-3 font-medium text-right">Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {workerPerf.map((wp) => (
                    <tr key={wp.workerId} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3 text-white font-medium">{wp.workerName}</td>
                      <td className="px-5 py-3 text-gray-400">{wp.totalBills} Bills</td>
                      <td className="px-5 py-3 text-right font-mono text-[#c5a880]">{formatRupeesCompact(wp.totalSales)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Top Expenses */}
        <div className="bg-[#15171e] border border-white/10 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-5 border-b border-white/5 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-white">Top Expense Categories</h2>
            <button
              onClick={() => navigate('/admin/expenses')}
              className="text-xs font-semibold text-[#c5a880] hover:text-[#d6be9a] flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-0 flex-1 overflow-auto">
            {topCategories.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No expenses for selected period.</div>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#1b1d26] text-gray-400">
                  <tr>
                    <th className="px-5 py-3 font-medium">Category</th>
                    <th className="px-5 py-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {topCategories.map((c) => (
                    <tr key={c.name} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3 text-white font-medium flex items-center gap-2">
                        <PieChartIcon className="w-4 h-4 text-gray-500" />
                        <span className="capitalize">{c.name.toLowerCase()}</span>
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-white">{formatRupeesCompact(c.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
