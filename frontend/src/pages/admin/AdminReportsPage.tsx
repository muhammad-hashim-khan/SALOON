import React, { useState, useEffect } from 'react';
import { 
  Printer, RotateCcw, FileText,
  CheckCircle2, DollarSign, Wallet
} from 'lucide-react';
import { reportService, AccountingReport } from '../../services/reportService';
import { settingsService } from '../../services/settingsService';
import { useAuth } from '../../hooks/useAuth';
import { formatRupeesCompact } from '../../utils/money';
import { formatDateTime } from '../../utils/reports/reportFormatters';

type ReportType = 'daily' | 'weekly' | 'monthly' | 'custom';

// Helpers to get ISO date strings
const getToday = () => new Date().toISOString().slice(0, 10);
const getStartOfWeek = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
};
const getEndOfWeek = (start: string) => {
  const d = new Date(start);
  d.setDate(d.getDate() + 6);
  return d.toISOString().slice(0, 10);
};
const getCurrentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const AdminReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({ salonName: 'CUT&STYLE', businessName: 'SALON & SPA' });
  
  // UI State
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [dateParam, setDateParam] = useState(getToday()); // for daily
  const [weekParam, setWeekParam] = useState(getStartOfWeek()); // for weekly start date
  const [monthParam, setMonthParam] = useState(getCurrentMonth()); // for monthly
  const [customFrom, setCustomFrom] = useState(getToday());
  const [customTo, setCustomTo] = useState(getToday());

  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<AccountingReport | null>(null);
  const [periodLabel, setPeriodLabel] = useState('');

  useEffect(() => {
    settingsService.getSettings().then(setSettings);
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      let from = '';
      let to = '';
      let label = '';

      if (reportType === 'daily') {
        from = dateParam;
        to = dateParam;
        label = new Date(from).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
      } else if (reportType === 'weekly') {
        from = weekParam;
        to = getEndOfWeek(weekParam);
        const df = new Date(from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const dt = new Date(to).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        label = `${df} – ${dt}`;
      } else if (reportType === 'monthly') {
        const [yyyy, mm] = monthParam.split('-');
        const y = parseInt(yyyy, 10);
        const m = parseInt(mm, 10) - 1;
        from = new Date(y, m, 1).toISOString().slice(0, 10);
        to = new Date(y, m + 1, 0).toISOString().slice(0, 10);
        label = new Date(y, m).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      } else if (reportType === 'custom') {
        from = customFrom;
        to = customTo;
        if (new Date(from) > new Date(to)) {
          alert('From Date must be before or equal to To Date');
          setIsGenerating(false);
          return;
        }
        const df = new Date(from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const dt = new Date(to).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        label = `${df} – ${dt}`;
      }

      setPeriodLabel(label);
      const data = await reportService.getAccountingReport('custom', from, to);
      
      // Verification logic internally:
      // data.executive.cashSales + data.executive.upiSales + data.executive.otherSales === data.executive.totalSales
      // data.executive.totalSales - data.executive.totalExpenses === data.executive.netCashFlow
      
      setReportData(data);
    } catch (error) {
      console.error(error);
      alert('Failed to generate report.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setReportData(null);
    setReportType('daily');
    setDateParam(getToday());
    setWeekParam(getStartOfWeek());
    setMonthParam(getCurrentMonth());
    setCustomFrom(getToday());
    setCustomTo(getToday());
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:space-y-0 print:bg-white print:text-black">
      {/* ────────────────── CONTROLS (Hidden on Print) ────────────────── */}
      <div className="print:hidden space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Financial Reports</h1>
          <p className="text-sm text-gray-400 mt-1">Generate professional accounting statements.</p>
        </div>

        <div className="bg-[#15171e] border border-white/10 rounded-2xl p-5 space-y-5">
          {/* Report Type Selector */}
          <div className="flex flex-wrap gap-2">
            {(['daily', 'weekly', 'monthly', 'custom'] as ReportType[]).map(t => (
              <button
                key={t}
                onClick={() => setReportType(t)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
                  reportType === t 
                    ? 'bg-[#c5a880] text-black shadow-lg shadow-[#c5a880]/20' 
                    : 'bg-[#1b1d26] text-gray-400 hover:text-white border border-white/10'
                }`}
              >
                {t} Report
              </button>
            ))}
          </div>

          {/* Date Controls */}
          <div className="flex flex-wrap items-end gap-4 pb-2 border-b border-white/5">
            {reportType === 'daily' && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Select Date</label>
                <input 
                  type="date" 
                  value={dateParam} 
                  onChange={e => setDateParam(e.target.value)} 
                  className="block bg-[#1b1d26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c5a880] w-[200px]"
                />
              </div>
            )}
            
            {reportType === 'weekly' && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Select Week</label>
                <input 
                  type="date" 
                  value={weekParam} 
                  onChange={e => {
                    const d = new Date(e.target.value);
                    const day = d.getDay();
                    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                    setWeekParam(new Date(d.setDate(diff)).toISOString().slice(0, 10));
                  }} 
                  className="block bg-[#1b1d26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c5a880] w-[200px]"
                />
                <p className="text-xs text-gray-500 mt-1">Select any day to pick its week</p>
              </div>
            )}

            {reportType === 'monthly' && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Select Month</label>
                <input 
                  type="month" 
                  value={monthParam} 
                  onChange={e => setMonthParam(e.target.value)} 
                  className="block bg-[#1b1d26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c5a880] w-[200px]"
                />
              </div>
            )}

            {reportType === 'custom' && (
              <div className="flex items-end gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">From Date</label>
                  <input 
                    type="date" 
                    value={customFrom} 
                    onChange={e => setCustomFrom(e.target.value)} 
                    className="block bg-[#1b1d26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c5a880] w-[160px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">To Date</label>
                  <input 
                    type="date" 
                    value={customTo} 
                    onChange={e => setCustomTo(e.target.value)} 
                    className="block bg-[#1b1d26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c5a880] w-[160px]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#c5a880] hover:bg-[#d6be9a] text-black text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : <FileText className="w-4 h-4" />}
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </button>
            <button 
              onClick={handleReset}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm font-medium transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            
            <div className="flex-1"></div>
            
            {reportData && (
              <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-600/20"
              >
                <Printer className="w-4 h-4" />
                Print PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ────────────────── REPORT VIEW (A4 Printable) ────────────────── */}
      {reportData && (
        <div className="bg-white rounded-2xl p-8 print:p-0 text-black mx-auto max-w-4xl shadow-2xl print:shadow-none print:w-[210mm] print:min-h-[297mm]">
          
          {/* HEADER */}
          <div className="text-center border-b-[3px] border-black pb-6 mb-8">
            <h1 className="text-4xl font-black tracking-[0.2em] uppercase text-black mb-1">{settings.salonName}</h1>
            <p className="text-sm font-bold tracking-[0.3em] uppercase text-gray-500 mb-6">{settings.businessName}</p>
            
            <h2 className="text-2xl font-bold uppercase tracking-wider text-black">Financial &amp; Sales Report</h2>
            <div className="mt-4 inline-block text-left bg-gray-50 border border-gray-200 px-6 py-3 rounded-lg text-sm">
              <table className="w-full">
                <tbody>
                  <tr><td className="pr-6 font-bold text-gray-500 uppercase tracking-wider text-xs pb-1">Report Type</td><td className="font-semibold capitalize text-black pb-1">{reportType} Report</td></tr>
                  <tr><td className="pr-6 font-bold text-gray-500 uppercase tracking-wider text-xs pb-1">Report Period</td><td className="font-bold text-black pb-1">{periodLabel}</td></tr>
                  <tr><td className="pr-6 font-bold text-gray-500 uppercase tracking-wider text-xs pb-1">Generated On</td><td className="font-semibold text-black pb-1">{formatDateTime(new Date().toISOString())}</td></tr>
                  <tr><td className="pr-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Generated By</td><td className="font-semibold text-black">{user?.fullName || 'Administrator'}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {reportData.executive.totalBills === 0 && reportData.executive.totalExpenses === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-gray-300 rounded-xl">
              <p className="text-xl font-bold text-gray-800 mb-2">No transactions recorded during this period.</p>
              <div className="flex justify-center gap-8 mt-6">
                <div><p className="text-sm text-gray-500 uppercase font-bold">Total Sales</p><p className="font-mono text-lg font-bold">₹0.00</p></div>
                <div><p className="text-sm text-gray-500 uppercase font-bold">Total Expenses</p><p className="font-mono text-lg font-bold">₹0.00</p></div>
                <div><p className="text-sm text-gray-500 uppercase font-bold">Net Cash Flow</p><p className="font-mono text-lg font-bold">₹0.00</p></div>
              </div>
            </div>
          ) : (
            <>
              {/* EXECUTIVE SUMMARY */}
              <div className="mb-10 print:break-inside-avoid">
                <h3 className="text-lg font-black uppercase tracking-wider border-b-2 border-gray-800 pb-2 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Executive Summary
                </h3>
                {/* EXECUTIVE KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Sales</p>
                    <p className="text-2xl font-black font-mono">{formatRupeesCompact(reportData.executive.totalSales)}</p>
                  </div>
                  <div className="bg-red-50 p-4 border border-red-100 rounded-lg">
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">Total Expenses</p>
                    <p className="text-2xl font-black font-mono text-red-700">{formatRupeesCompact(reportData.executive.totalExpenses)}</p>
                  </div>
                  <div className="bg-emerald-50 p-4 border border-emerald-100 rounded-lg">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Net Cash Flow</p>
                    <p className="text-2xl font-black font-mono text-emerald-700">{formatRupeesCompact(reportData.executive.netCashFlow)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 print:grid-cols-4 gap-4">
                  <div className="border border-gray-200 p-3 rounded-lg"><p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Bills</p><p className="text-lg font-bold">{reportData.executive.totalBills}</p></div>
                  <div className="border border-gray-200 p-3 rounded-lg"><p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Avg Bill Value</p><p className="text-lg font-bold font-mono">{formatRupeesCompact(reportData.executive.averageBill)}</p></div>
                  <div className="border border-gray-200 p-3 rounded-lg"><p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Cash Sales</p><p className="text-lg font-bold font-mono text-emerald-600">{formatRupeesCompact(reportData.executive.cashSales)}</p></div>
                  <div className="border border-gray-200 p-3 rounded-lg"><p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">UPI Sales</p><p className="text-lg font-bold font-mono text-indigo-600">{formatRupeesCompact(reportData.executive.upiSales)}</p></div>
                </div>
              </div>

              {/* MONEY FLOW & CASH SUMMARY */}
              <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-8 mb-10 print:break-inside-avoid">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider border-b-2 border-gray-800 pb-2 mb-4 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> Money Flow Summary
                  </h3>
                  <table className="w-full text-sm">
                    <tbody>
                      <tr><td colSpan={2} className="font-bold text-xs uppercase tracking-wider text-gray-500 pt-2 pb-1">Incoming</td></tr>
                      <tr><td className="py-1">Cash Sales</td><td className="text-right font-mono">{formatRupeesCompact(reportData.executive.cashSales)}</td></tr>
                      <tr><td className="py-1">UPI Sales</td><td className="text-right font-mono">{formatRupeesCompact(reportData.executive.upiSales)}</td></tr>
                      {reportData.executive.otherSales > 0 && <tr><td className="py-1">Other Incoming</td><td className="text-right font-mono">{formatRupeesCompact(reportData.executive.otherSales)}</td></tr>}
                      <tr className="border-t border-black"><td className="py-2 font-bold uppercase text-xs">Total Incoming</td><td className="text-right font-mono font-bold text-emerald-600">{formatRupeesCompact(reportData.executive.totalSales)}</td></tr>
                      
                      <tr><td colSpan={2} className="font-bold text-xs uppercase tracking-wider text-gray-500 pt-4 pb-1">Outgoing</td></tr>
                      <tr><td className="py-1">Expenses</td><td className="text-right font-mono text-red-600">{formatRupeesCompact(reportData.executive.totalExpenses)}</td></tr>
                      <tr className="border-t border-black"><td className="py-2 font-bold uppercase text-xs">Total Outgoing</td><td className="text-right font-mono font-bold text-red-600">{formatRupeesCompact(reportData.executive.totalExpenses)}</td></tr>
                      
                      <tr className="border-t-[3px] border-black"><td className="py-2 font-black uppercase tracking-widest text-sm">Net Cash Flow</td><td className="text-right font-mono font-black text-lg">{formatRupeesCompact(reportData.executive.netCashFlow)}</td></tr>
                    </tbody>
                  </table>
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider border-b-2 border-gray-800 pb-2 mb-4 flex items-center gap-2">
                    <Wallet className="w-4 h-4" /> Cash Summary
                  </h3>
                  <table className="w-full text-sm">
                    <tbody>
                      <tr><td className="py-1.5 text-gray-600">Opening Cash Balance</td><td className="text-right font-medium italic text-gray-400 text-xs">Not Recorded</td></tr>
                      <tr><td className="py-1.5">Cash Sales (In)</td><td className="text-right font-mono text-emerald-600">+{formatRupeesCompact(reportData.cash.cashSales)}</td></tr>
                      <tr><td className="py-1.5">Cash Expenses (Out)</td><td className="text-right font-mono text-red-600">−{formatRupeesCompact(reportData.cash.cashExpenses)}</td></tr>
                      <tr className="border-t-2 border-dashed border-gray-300">
                        <td className="py-2.5 font-bold uppercase text-xs tracking-wider">Operational Cash Flow</td>
                        <td className="text-right font-mono font-bold">{formatRupeesCompact(reportData.cash.closingBalance)}</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-[10px] text-gray-500 mt-4 italic border-l-2 border-gray-300 pl-2">
                    Note: UPI transactions are credited directly to the bank account and are not included in physical cash handling.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-10 print:break-inside-avoid">
                {/* PAYMENT METHOD SUMMARY */}
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider border-b border-gray-300 pb-2 mb-3">Payment Method Summary</h3>
                  <table className="w-full text-sm">
                    <thead className="border-b-2 border-black">
                      <tr>
                        <th className="py-2 text-left font-bold text-xs uppercase tracking-wider">Method</th>
                        <th className="py-2 text-center font-bold text-xs uppercase tracking-wider">Bills</th>
                        <th className="py-2 text-right font-bold text-xs uppercase tracking-wider">Amount</th>
                        <th className="py-2 text-right font-bold text-xs uppercase tracking-wider">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reportData.paymentMethods.map(pm => (
                        <tr key={pm.method}>
                          <td className="py-2 font-semibold uppercase">{pm.method}</td>
                          <td className="py-2 text-center">{pm.count}</td>
                          <td className="py-2 text-right font-mono">{formatRupeesCompact(pm.total)}</td>
                          <td className="py-2 text-right font-mono text-gray-600">{pm.percent.toFixed(2)}%</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-black font-bold">
                        <td className="py-2 uppercase text-xs tracking-wider">Total</td>
                        <td className="py-2 text-center">{reportData.executive.totalBills}</td>
                        <td className="py-2 text-right font-mono">{formatRupeesCompact(reportData.executive.totalSales)}</td>
                        <td className="py-2 text-right font-mono">100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* EXPENSE SUMMARY */}
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider border-b border-gray-300 pb-2 mb-3">Expense Summary By Category</h3>
                  <table className="w-full text-sm">
                    <thead className="border-b-2 border-black">
                      <tr>
                        <th className="py-2 text-left font-bold text-xs uppercase tracking-wider">Category</th>
                        <th className="py-2 text-right font-bold text-xs uppercase tracking-wider">Amount</th>
                        <th className="py-2 text-right font-bold text-xs uppercase tracking-wider">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reportData.expenseCategories.length === 0 ? (
                        <tr><td colSpan={3} className="py-4 text-center italic text-gray-500">No expenses recorded</td></tr>
                      ) : reportData.expenseCategories.map(ec => (
                        <tr key={ec.category}>
                          <td className="py-2 font-medium capitalize">{ec.category.toLowerCase()}</td>
                          <td className="py-2 text-right font-mono">{formatRupeesCompact(ec.total)}</td>
                          <td className="py-2 text-right font-mono text-gray-600">{ec.percent.toFixed(2)}%</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-black font-bold">
                        <td className="py-2 uppercase text-xs tracking-wider">Total</td>
                        <td className="py-2 text-right font-mono">{formatRupeesCompact(reportData.executive.totalExpenses)}</td>
                        <td className="py-2 text-right font-mono">{reportData.expenseCategories.length > 0 ? '100%' : '0%'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SALES BREAKDOWN */}
              <div className="mb-10 print:break-inside-avoid">
                <h3 className="text-sm font-black uppercase tracking-wider border-b-2 border-gray-800 pb-2 mb-4">Sales Breakdown</h3>
                <table className="w-full text-sm">
                  <thead className="border-b-2 border-black bg-gray-50">
                    <tr>
                      <th className="py-2 px-2 text-left font-bold text-xs uppercase tracking-wider">Date</th>
                      <th className="py-2 px-2 text-center font-bold text-xs uppercase tracking-wider">Bills</th>
                      <th className="py-2 px-2 text-right font-bold text-xs uppercase tracking-wider">Cash Sales</th>
                      <th className="py-2 px-2 text-right font-bold text-xs uppercase tracking-wider">UPI Sales</th>
                      <th className="py-2 px-2 text-right font-bold text-xs uppercase tracking-wider">Total Sales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData.dailyBreakdown.map(day => (
                      <tr key={day.date}>
                        <td className="py-2 px-2 font-medium text-gray-800">{new Date(day.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                        <td className="py-2 px-2 text-center">{day.bills}</td>
                        <td className="py-2 px-2 text-right font-mono">{formatRupeesCompact(day.cash)}</td>
                        <td className="py-2 px-2 text-right font-mono">{formatRupeesCompact(day.upi)}</td>
                        <td className="py-2 px-2 text-right font-mono font-bold">{formatRupeesCompact(day.total)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-black bg-gray-50 font-bold">
                      <td className="py-3 px-2 uppercase text-xs tracking-wider">Total</td>
                      <td className="py-3 px-2 text-center">{reportData.executive.totalBills}</td>
                      <td className="py-3 px-2 text-right font-mono">{formatRupeesCompact(reportData.executive.cashSales)}</td>
                      <td className="py-3 px-2 text-right font-mono">{formatRupeesCompact(reportData.executive.upiSales)}</td>
                      <td className="py-3 px-2 text-right font-mono">{formatRupeesCompact(reportData.executive.totalSales)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* WORKER SALES SUMMARY */}
              <div className="mb-10 print:break-before-page">
                <h3 className="text-sm font-black uppercase tracking-wider border-b-2 border-gray-800 pb-2 mb-4">Worker Sales Summary</h3>
                <table className="w-full text-sm">
                  <thead className="border-b-2 border-black bg-gray-50">
                    <tr>
                      <th className="py-2 px-2 text-left font-bold text-xs uppercase tracking-wider">Worker</th>
                      <th className="py-2 px-2 text-center font-bold text-xs uppercase tracking-wider">Bills</th>
                      <th className="py-2 px-2 text-right font-bold text-xs uppercase tracking-wider">Cash Sales</th>
                      <th className="py-2 px-2 text-right font-bold text-xs uppercase tracking-wider">UPI Sales</th>
                      <th className="py-2 px-2 text-right font-bold text-xs uppercase tracking-wider">Total Sales</th>
                      <th className="py-2 px-2 text-right font-bold text-xs uppercase tracking-wider">Average Bill</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData.workerSummary.map(w => (
                      <tr key={w.workerName}>
                        <td className="py-2 px-2 font-semibold text-gray-900">{w.workerName}</td>
                        <td className="py-2 px-2 text-center">{w.bills}</td>
                        <td className="py-2 px-2 text-right font-mono">{formatRupeesCompact(w.cash)}</td>
                        <td className="py-2 px-2 text-right font-mono">{formatRupeesCompact(w.upi)}</td>
                        <td className="py-2 px-2 text-right font-mono font-bold">{formatRupeesCompact(w.total)}</td>
                        <td className="py-2 px-2 text-right font-mono text-gray-600">{formatRupeesCompact(w.avg)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* DETAILED TRANSACTIONS */}
              <div className="mb-10 print:break-before-page">
                <h3 className="text-sm font-black uppercase tracking-wider border-b-2 border-gray-800 pb-2 mb-4">Expense Transactions</h3>
                <table className="w-full text-sm">
                  <thead className="border-b-2 border-black bg-gray-50">
                    <tr>
                      <th className="py-2 px-2 text-left font-bold text-xs uppercase tracking-wider">Date</th>
                      <th className="py-2 px-2 text-left font-bold text-xs uppercase tracking-wider">Category</th>
                      <th className="py-2 px-2 text-left font-bold text-xs uppercase tracking-wider">Description</th>
                      <th className="py-2 px-2 text-right font-bold text-xs uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData.transactions.expenses.length === 0 ? (
                      <tr><td colSpan={4} className="py-4 text-center italic text-gray-500">No expenses recorded</td></tr>
                    ) : reportData.transactions.expenses.map(e => (
                      <tr key={e.id} className="print:break-inside-avoid">
                        <td className="py-2 px-2 whitespace-nowrap">{new Date(e.expenseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="py-2 px-2 uppercase text-xs font-semibold">{e.category}</td>
                        <td className="py-2 px-2 break-words max-w-xs">{e.description}</td>
                        <td className="py-2 px-2 text-right font-mono font-bold">{formatRupeesCompact(e.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mb-10 print:break-before-page">
                <h3 className="text-sm font-black uppercase tracking-wider border-b-2 border-gray-800 pb-2 mb-4">Sales Transactions</h3>
                <table className="w-full text-sm">
                  <thead className="border-b-2 border-black bg-gray-50">
                    <tr>
                      <th className="py-2 px-2 text-left font-bold text-xs uppercase tracking-wider">Bill Number</th>
                      <th className="py-2 px-2 text-left font-bold text-xs uppercase tracking-wider">Date &amp; Time</th>
                      <th className="py-2 px-2 text-left font-bold text-xs uppercase tracking-wider">Worker</th>
                      <th className="py-2 px-2 text-left font-bold text-xs uppercase tracking-wider">Customer</th>
                      <th className="py-2 px-2 text-center font-bold text-xs uppercase tracking-wider">Method</th>
                      <th className="py-2 px-2 text-right font-bold text-xs uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData.transactions.bills.length === 0 ? (
                      <tr><td colSpan={6} className="py-4 text-center italic text-gray-500">No sales recorded</td></tr>
                    ) : reportData.transactions.bills.map(b => (
                      <tr key={b.id} className="print:break-inside-avoid">
                        <td className="py-2 px-2 font-mono text-xs">{b.billNumber}</td>
                        <td className="py-2 px-2 text-xs">{formatDateTime(b.createdAt)}</td>
                        <td className="py-2 px-2 font-medium">{b.workerName}</td>
                        <td className="py-2 px-2">{b.customerName || 'Walk-in'}</td>
                        <td className="py-2 px-2 text-center uppercase text-xs font-semibold">{b.paymentMethod}</td>
                        <td className="py-2 px-2 text-right font-mono font-bold">{formatRupeesCompact(b.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* FINANCIAL SUMMARY RECAP */}
              <div className="print:break-inside-avoid bg-gray-50 border-2 border-black p-6 rounded-xl">
                <h3 className="text-lg font-black uppercase tracking-widest text-center mb-6">Final Financial Summary</h3>
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Incoming</p>
                    <p className="text-3xl font-black font-mono text-emerald-700">{formatRupeesCompact(reportData.executive.totalSales)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Outgoing</p>
                    <p className="text-3xl font-black font-mono text-red-700">{formatRupeesCompact(reportData.executive.totalExpenses)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Net Cash Flow</p>
                    <p className="text-3xl font-black font-mono">{formatRupeesCompact(reportData.executive.netCashFlow)}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* FOOTER */}
          <div className="mt-16 pt-6 border-t border-gray-300 text-center text-xs text-gray-400 print:text-black">
            <p className="font-bold mb-1 uppercase tracking-wider">{settings.salonName} — {settings.businessName}</p>
            <p>Financial report generated securely by the CUT&amp;STYLE Management System.</p>
            <p className="mt-2 uppercase tracking-widest font-bold">Confidential — For Internal Business Use Only</p>
          </div>
        </div>
      )}
    </div>
  );
};
