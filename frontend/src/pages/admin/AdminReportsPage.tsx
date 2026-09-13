import React, { useState, useEffect } from 'react';
import { 
  FileText, Printer, FileSpreadsheet, FileIcon, 
  Calendar, Filter 
} from 'lucide-react';
import { 
  LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';

import { reportService, ReportDateRange } from '../../services/reportService';
import { workerService } from '../../services/workerService';
import { settingsService } from '../../services/settingsService';
import { formatRupeesCompact } from '../../utils/money';
import { formatDateTime, formatDateOnly } from '../../utils/reports/reportFormatters';

import { downloadSalesPDF, downloadExpensePDF, downloadFinancialSummaryPDF } from '../../utils/reports/pdfReport';
import { downloadExcelReport } from '../../utils/reports/excelReport';
import { downloadSalesCSV, downloadExpenseCSV, downloadFinancialSummaryCSV } from '../../utils/reports/csvReport';
import { auditService } from '../../services/auditService';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

type ReportType = 'sales' | 'expenses' | 'payments' | 'workers' | 'summary';

const RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7days', label: 'Last 7 Days' },
  { value: 'month', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'last3Months', label: 'Last 3 Months' },
  { value: 'custom', label: 'Custom Range' }
];

const CATEGORIES = ['RENT', 'ELECTRICITY', 'WATER', 'SALARY', 'PRODUCTS', 'MAINTENANCE', 'MARKETING', 'OTHER'];
const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6', '#f43f5e', '#6366f1'];

export const AdminReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('summary');
  const [dateRange, setDateRange] = useState<ReportDateRange>('month');
  const [customFrom, setCustomFrom] = useState(new Date().toISOString().slice(0, 10));
  const [customTo, setCustomTo] = useState(new Date().toISOString().slice(0, 10));

  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [workerFilter, setWorkerFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const { user } = useAuth();
  const [settings, setSettings] = useState({ salonName: 'CUT&STYLE', businessName: 'SALON & SPA', phone: '', address: '' });
  const [workers, setWorkers] = useState<{id: string; fullName: string; role: string; status: string; email: string; createdAt: string}[]>([]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (reportType === 'sales') await downloadSalesPDF(dateRange, customFrom, customTo, paymentFilter, workerFilter);
    else if (reportType === 'expenses') await downloadExpensePDF(dateRange, customFrom, customTo, categoryFilter);
    else await downloadFinancialSummaryPDF(dateRange, customFrom, customTo);
    auditService.logAction(user?.id || 'admin', user?.fullName || 'Admin', 'DOWNLOAD_REPORT', 'REPORT', null, `Downloaded ${reportType} report as PDF`);
    toast.success('PDF downloaded.');
  };

  const handleDownloadCSV = async () => {
    if (reportType === 'sales') await downloadSalesCSV(dateRange, customFrom, customTo, paymentFilter, workerFilter);
    else if (reportType === 'expenses') await downloadExpenseCSV(dateRange, customFrom, customTo, categoryFilter);
    else await downloadFinancialSummaryCSV(dateRange, customFrom, customTo);
    auditService.logAction(user?.id || 'admin', user?.fullName || 'Admin', 'DOWNLOAD_REPORT', 'REPORT', null, `Downloaded ${reportType} report as CSV`);
    toast.success('CSV downloaded.');
  };

  const handleDownloadExcel = async () => {
    await downloadExcelReport(dateRange, customFrom, customTo);
    auditService.logAction(user?.id || 'admin', user?.fullName || 'Admin', 'DOWNLOAD_REPORT', 'REPORT', null, `Downloaded combined report as Excel`);
    toast.success('Excel downloaded.');
  };

  // Load settings and workers once
  useEffect(() => {
    settingsService.getSettings().then(setSettings);
    workerService.getWorkers().then(setWorkers);
  }, []);

  // Report Data State
  const [summaryData, setSummaryData] = useState<any>(null);
  const [salesData, setSalesData] = useState<any>(null);
  const [expData, setExpData] = useState<any>(null);
  const [payData, setPayData] = useState<any>(null);
  const [workerData, setWorkerData] = useState<any>(null);
  const [vsData, setVsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Reload report data on filter changes
  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      reportService.getFinancialSummary(dateRange, customFrom, customTo),
      reportService.getSalesReport(dateRange, customFrom, customTo, paymentFilter, workerFilter),
      reportService.getExpenseReport(dateRange, customFrom, customTo, categoryFilter),
      reportService.getPaymentReport(dateRange, customFrom, customTo),
      reportService.getWorkerReport(dateRange, customFrom, customTo),
      reportService.getSalesVsExpenses(dateRange, customFrom, customTo),
    ]).then(([summary, sales, exp, pay, worker, vs]) => {
      setSummaryData(summary);
      setSalesData(sales);
      setExpData(exp);
      setPayData(pay);
      setWorkerData(worker);
      setVsData(vs);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, [dateRange, customFrom, customTo, paymentFilter, workerFilter, categoryFilter]);

  if (isLoading && !summaryData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#c5a880] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 text-sm">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header (Hidden on print) */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Reports</h1>
          <p className="text-sm text-gray-400 mt-1">
            Analyze CUT&STYLE sales, payments, expenses and financial performance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1b1d26] border border-white/10 hover:bg-white/5 text-gray-300 text-xs font-medium transition-colors">
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1b1d26] border border-white/10 hover:bg-white/5 text-red-400 text-xs font-medium transition-colors">
            <FileIcon className="w-3.5 h-3.5" /> PDF
          </button>
          <button onClick={handleDownloadExcel} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1b1d26] border border-white/10 hover:bg-white/5 text-emerald-400 text-xs font-medium transition-colors">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
          </button>
          <button onClick={handleDownloadCSV} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1b1d26] border border-white/10 hover:bg-white/5 text-blue-400 text-xs font-medium transition-colors">
            <FileText className="w-3.5 h-3.5" /> CSV
          </button>
        </div>
      </div>

      {/* Print Header (Only visible on print) */}
      <div className="hidden print:block text-center border-b border-black pb-4 mb-4">
        <h1 className="text-3xl font-bold text-black tracking-widest">{settings.salonName}</h1>
        <h2 className="text-lg font-medium text-gray-800">{settings.businessName}</h2>
        <h3 className="text-xl font-bold text-black mt-4 capitalize">{reportType} Report</h3>
        <p className="text-sm text-gray-600 mt-1">Generated On: {formatDateTime(new Date().toISOString())}</p>
      </div>

      {/* Controls (Hidden on print) */}
      <div className="print:hidden bg-[#15171e] border border-white/10 rounded-2xl p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Report Type */}
          <div className="flex items-center gap-2 bg-[#1b1d26] p-1 rounded-xl border border-white/10">
            {(['summary', 'sales', 'expenses', 'payments', 'workers'] as ReportType[]).map(t => (
              <button
                key={t}
                onClick={() => setReportType(t)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  reportType === t ? 'bg-[#c5a880] text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          
          <div className="w-px h-6 bg-white/10 hidden md:block"></div>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value as ReportDateRange)}
              className="bg-[#1b1d26] border border-white/10 rounded-xl px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-[#c5a880]"
            >
              {RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          {/* Custom Date Inputs */}
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={customFrom} 
                onChange={e => setCustomFrom(e.target.value)} 
                className="bg-[#1b1d26] border border-white/10 rounded-xl px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-[#c5a880]"
              />
              <span className="text-gray-500">to</span>
              <input 
                type="date" 
                value={customTo} 
                onChange={e => setCustomTo(e.target.value)} 
                className="bg-[#1b1d26] border border-white/10 rounded-xl px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-[#c5a880]"
              />
            </div>
          )}
        </div>

        {/* Dynamic Filters based on Report Type */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-white/5">
          <Filter className="w-4 h-4 text-gray-500" />
          
          {(reportType === 'sales' || reportType === 'payments' || reportType === 'workers') && (
            <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} className="bg-[#1b1d26] border border-white/10 rounded-xl px-3 py-1.5 text-sm text-gray-300 outline-none">
              <option value="ALL">All Payments</option>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
            </select>
          )}

          {(reportType === 'sales' || reportType === 'workers') && (
            <select value={workerFilter} onChange={e => setWorkerFilter(e.target.value)} className="bg-[#1b1d26] border border-white/10 rounded-xl px-3 py-1.5 text-sm text-gray-300 outline-none">
              <option value="ALL">All Workers</option>
              {workers.map(w => <option key={w.id} value={w.id}>{w.fullName}</option>)}
            </select>
          )}

          {(reportType === 'expenses' || reportType === 'summary') && (
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="bg-[#1b1d26] border border-white/10 rounded-xl px-3 py-1.5 text-sm text-gray-300 outline-none capitalize">
              <option value="ALL">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.toLowerCase()}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* --- REPORT VIEWS --- */}

      {/* 1. FINANCIAL SUMMARY */}
      {reportType === 'summary' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#15171e] print:bg-white print:border-black border border-white/10 rounded-2xl p-6">
              <div className="text-sm font-medium text-gray-400 print:text-black uppercase tracking-wider mb-2">Total Sales</div>
              <div className="text-3xl font-bold text-white print:text-black">{formatRupeesCompact(summaryData.totalSales)}</div>
              <div className="mt-2 text-xs text-gray-500 print:text-black">{summaryData.numberOfBills} Bills</div>
            </div>
            <div className="bg-[#15171e] print:bg-white print:border-black border border-white/10 rounded-2xl p-6">
              <div className="text-sm font-medium text-gray-400 print:text-black uppercase tracking-wider mb-2">Total Expenses</div>
              <div className="text-3xl font-bold text-red-400 print:text-black">{formatRupeesCompact(summaryData.totalExpenses)}</div>
              <div className="mt-2 text-xs text-gray-500 print:text-black">{summaryData.numberOfExpenses} Expenses</div>
            </div>
            <div className="bg-[#15171e] print:bg-white print:border-black border border-white/10 rounded-2xl p-6">
              <div className="text-sm font-medium text-gray-400 print:text-black uppercase tracking-wider mb-2">Estimated Net</div>
              <div className="text-3xl font-bold text-[#c5a880] print:text-black">{formatRupeesCompact(summaryData.estimatedNet)}</div>
              <div className="mt-2 text-xs text-gray-500 print:text-black">Sales - Expenses</div>
            </div>
          </div>
          
          <div className="bg-[#15171e] print:bg-white print:border-black border border-white/10 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-white print:text-black mb-6">Sales vs Expenses Trend</h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vsData.points} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/100}`} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#1b1d26', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ fontWeight: 'bold' }}
                    formatter={(val: number, name: string) => [formatRupeesCompact(val), name === 'sales' ? 'Sales' : 'Expenses']}
                  />
                  <Line type="monotone" dataKey="sales" stroke="#c5a880" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 2. SALES REPORT */}
      {reportType === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#15171e] print:bg-white print:border-black border border-white/10 rounded-2xl p-5">
              <div className="text-xs text-gray-400 print:text-black uppercase">Total Sales</div>
              <div className="text-2xl font-bold text-white print:text-black">{formatRupeesCompact(salesData.totalSales)}</div>
            </div>
            <div className="bg-[#15171e] print:bg-white print:border-black border border-white/10 rounded-2xl p-5">
              <div className="text-xs text-gray-400 print:text-black uppercase">Bills</div>
              <div className="text-2xl font-bold text-white print:text-black">{salesData.totalBills}</div>
            </div>
            <div className="bg-[#15171e] print:bg-white print:border-black border border-white/10 rounded-2xl p-5">
              <div className="text-xs text-gray-400 print:text-black uppercase">Average Bill</div>
              <div className="text-2xl font-bold text-white print:text-black">{formatRupeesCompact(salesData.averageBill)}</div>
            </div>
          </div>

          <div className="bg-[#15171e] print:bg-white print:border-black border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#1b1d26] print:bg-gray-100 text-gray-400 print:text-black border-b border-white/5 print:border-black">
                  <tr>
                    <th className="px-5 py-3 font-medium">Bill No</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-5 py-3 font-medium">Worker</th>
                    <th className="px-5 py-3 font-medium">Payment</th>
                    <th className="px-5 py-3 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 print:divide-black">
                  {salesData.bills.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-500">No sales data for this period.</td></tr>
                  ) : salesData.bills.map((b: any) => {
                    const w = workers.find(w => w.id === b.workerId);
                    return (
                    <tr key={b.id} className="print:text-black">
                      <td className="px-5 py-3 font-mono text-[#c5a880] print:text-black">{b.billNumber}</td>
                      <td className="px-5 py-3 text-gray-300 print:text-black">{formatDateTime(b.createdAt)}</td>
                      <td className="px-5 py-3 text-white print:text-black">{b.customerName || 'Walk-in'}</td>
                      <td className="px-5 py-3 text-white print:text-black">{w?.fullName || b.workerId}</td>
                      <td className="px-5 py-3 text-gray-400 print:text-black">{b.paymentMethod}</td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-white print:text-black">{formatRupeesCompact(b.total)}</td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. EXPENSES REPORT */}
      {reportType === 'expenses' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#15171e] print:bg-white print:border-black border border-white/10 rounded-2xl p-5">
              <div className="text-xs text-gray-400 print:text-black uppercase">Total Expenses</div>
              <div className="text-2xl font-bold text-red-400 print:text-black">{formatRupeesCompact(expData.totalExpenses)}</div>
            </div>
            <div className="bg-[#15171e] print:bg-white print:border-black border border-white/10 rounded-2xl p-5">
              <div className="text-xs text-gray-400 print:text-black uppercase">Count</div>
              <div className="text-2xl font-bold text-white print:text-black">{expData.numberOfExpenses}</div>
            </div>
            <div className="bg-[#15171e] print:bg-white print:border-black border border-white/10 rounded-2xl p-5">
              <div className="text-xs text-gray-400 print:text-black uppercase">Average Expense</div>
              <div className="text-2xl font-bold text-white print:text-black">{formatRupeesCompact(expData.averageExpense)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#15171e] print:bg-white print:border-black border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#1b1d26] print:bg-gray-100 text-gray-400 print:text-black border-b border-white/5 print:border-black">
                    <tr>
                      <th className="px-5 py-3 font-medium">Date</th>
                      <th className="px-5 py-3 font-medium">Category</th>
                      <th className="px-5 py-3 font-medium">Description</th>
                      <th className="px-5 py-3 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 print:divide-black">
                    {expData.expenses.length === 0 ? (
                      <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-500">No expenses for this period.</td></tr>
                    ) : expData.expenses.map((e: any) => (
                      <tr key={e.id} className="print:text-black">
                        <td className="px-5 py-3 text-gray-300 print:text-black">{formatDateOnly(e.expenseDate)}</td>
                        <td className="px-5 py-3 text-gray-400 print:text-black">{e.category}</td>
                        <td className="px-5 py-3 text-white print:text-black truncate max-w-[200px]">{e.description}</td>
                        <td className="px-5 py-3 text-right font-mono font-bold text-white print:text-black">{formatRupeesCompact(e.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-[#15171e] print:bg-white print:border-black border border-white/10 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-white print:text-black mb-4">Category Breakdown</h2>
              {expData.categoryBreakdown.length > 0 ? (
                <div className="space-y-4">
                  <div className="h-[200px] w-full print:hidden">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={expData.categoryBreakdown} dataKey="total" cx="50%" cy="50%" innerRadius={50} outerRadius={70} stroke="none">
                          {expData.categoryBreakdown.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(val: number) => formatRupeesCompact(val)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {expData.categoryBreakdown.map((c: any, idx: number) => (
                      <div key={c.category} className="flex justify-between text-sm">
                        <span className="text-gray-400 print:text-black flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full print:hidden" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                          {c.category} ({c.count})
                        </span>
                        <span className="text-white print:text-black font-mono">{formatRupeesCompact(c.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center">No data</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. PAYMENTS REPORT */}
      {reportType === 'payments' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#15171e] print:bg-white print:border-black border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white print:text-black mb-6">Payment Summary</h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400 print:text-black">Cash Sales</span>
                  <span className="text-emerald-400 print:text-black font-bold">{formatRupeesCompact(payData.cashSales)}</span>
                </div>
                <div className="w-full bg-gray-800 print:bg-gray-200 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${payData.cashPercent}%` }}></div>
                </div>
                <div className="text-right text-xs text-gray-500 print:text-black mt-1">{payData.cashPercent.toFixed(1)}%</div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400 print:text-black">UPI Sales</span>
                  <span className="text-indigo-400 print:text-black font-bold">{formatRupeesCompact(payData.upiSales)}</span>
                </div>
                <div className="w-full bg-gray-800 print:bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${payData.upiPercent}%` }}></div>
                </div>
                <div className="text-right text-xs text-gray-500 print:text-black mt-1">{payData.upiPercent.toFixed(1)}%</div>
              </div>
              
              <div className="pt-4 border-t border-white/10 print:border-black flex justify-between">
                <span className="text-white print:text-black font-bold">Total Processed</span>
                <span className="text-[#c5a880] print:text-black font-bold text-lg">{formatRupeesCompact(payData.totalSales)}</span>
              </div>
            </div>
          </div>
          <div className="bg-[#15171e] print:bg-white print:border-black border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white print:text-black mb-6">Visual Split</h2>
            {payData.totalSales > 0 ? (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{name: 'Cash', value: payData.cashSales}, {name: 'UPI', value: payData.upiSales}]} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={80} stroke="none">
                      <Cell fill="#10b981" />
                      <Cell fill="#6366f1" />
                    </Pie>
                    <RechartsTooltip formatter={(val: number) => formatRupeesCompact(val)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-20">No data</p>
            )}
          </div>
        </div>
      )}

      {/* 5. WORKERS REPORT */}
      {reportType === 'workers' && (
        <div className="bg-[#15171e] print:bg-white print:border-black border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#1b1d26] print:bg-gray-100 text-gray-400 print:text-black border-b border-white/5 print:border-black">
                <tr>
                  <th className="px-5 py-3 font-medium">Worker</th>
                  <th className="px-5 py-3 font-medium text-center">Bills</th>
                  <th className="px-5 py-3 font-medium text-right">Cash</th>
                  <th className="px-5 py-3 font-medium text-right">UPI</th>
                  <th className="px-5 py-3 font-medium text-right">Total Sales</th>
                  <th className="px-5 py-3 font-medium text-right">Average Bill</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 print:divide-black">
                {workerData.workerPerformance.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-500">No active workers.</td></tr>
                ) : workerData.workerPerformance.map((w: any) => (
                  <tr key={w.workerId} className="print:text-black">
                    <td className="px-5 py-4 text-white print:text-black font-medium">{w.workerName}</td>
                    <td className="px-5 py-4 text-center text-gray-400 print:text-black">{w.totalBills}</td>
                    <td className="px-5 py-4 text-right text-gray-400 print:text-black">{formatRupeesCompact(w.cashSales)}</td>
                    <td className="px-5 py-4 text-right text-gray-400 print:text-black">{formatRupeesCompact(w.upiSales)}</td>
                    <td className="px-5 py-4 text-right font-mono font-bold text-[#c5a880] print:text-black">{formatRupeesCompact(w.totalSales)}</td>
                    <td className="px-5 py-4 text-right text-gray-400 print:text-black">{formatRupeesCompact(w.averageBill)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
