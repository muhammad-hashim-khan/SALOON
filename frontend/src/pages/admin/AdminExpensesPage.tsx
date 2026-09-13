import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, PlusCircle, Edit, Trash2, X, AlertCircle, WalletCards } from 'lucide-react';
import toast from 'react-hot-toast';
import { expenseService } from '../../services/expenseService';
import { useAuth } from '../../hooks/useAuth';
import { MockExpense, ExpenseCategory } from '../../types/expense';
import { formatRupeesCompact, rupeesToPaise, paiseToRupees } from '../../utils/money';
import { DateRange, calcExpenseStats, calcCategoryBreakdown, filterExpensesByRange } from '../../utils/analytics';
import { auditService } from '../../services/auditService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

type FilterDate = 'all' | 'today' | 'yesterday' | '7days' | 'month';
type FilterCategory = 'ALL' | ExpenseCategory;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const CATEGORIES: ExpenseCategory[] = ['RENT', 'ELECTRICITY', 'WATER', 'SALARY', 'PRODUCTS', 'MAINTENANCE', 'MARKETING', 'OTHER'];
const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6', '#f43f5e', '#6366f1'];

export const AdminExpensesPage: React.FC = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<MockExpense[]>([]);
  
  // Search & Filters
  const [query, setQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<FilterDate>('all');
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<MockExpense | null>(null);

  // Form states
  const [formData, setFormData] = useState<{
    date: string;
    category: ExpenseCategory;
    description: string;
    amount: string;
  }>({
    date: new Date().toISOString().slice(0, 10),
    category: 'RENT',
    description: '',
    amount: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadExpenses = () => {
    setExpenses(expenseService.getExpenses());
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const filteredExpenses = useMemo(() => {
    let result = expenses;
    
    // Search
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        e => e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)
      );
    }
    
    // Date filter
    if (dateFilter !== 'all') {
      result = filterExpensesByRange(result, dateFilter as DateRange);
    }
    
    // Category filter
    if (categoryFilter !== 'ALL') {
      result = result.filter(e => e.category === categoryFilter);
    }
    
    return result;
  }, [expenses, query, dateFilter, categoryFilter]);

  // Summaries
  const totalStats = useMemo(() => calcExpenseStats(expenses), [expenses]);
  const monthStats = useMemo(() => calcExpenseStats(filterExpensesByRange(expenses, 'month')), [expenses]);
  const todayStats = useMemo(() => calcExpenseStats(filterExpensesByRange(expenses, 'today')), [expenses]);
  
  const breakdownData = useMemo(() => {
    return calcCategoryBreakdown(filteredExpenses).map((b) => ({
      ...b,
      color: COLORS[CATEGORIES.indexOf(b.name as ExpenseCategory) % COLORS.length]
    }));
  }, [filteredExpenses]);

  const openAddModal = () => {
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      category: 'RENT',
      description: '',
      amount: '',
    });
    setSelectedExpense(null);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (expense: MockExpense) => {
    setFormData({
      date: expense.expenseDate,
      category: expense.category,
      description: expense.description,
      amount: paiseToRupees(expense.amount).toString(),
    });
    setSelectedExpense(expense);
    setFormError('');
    setIsModalOpen(true);
  };

  const openDeleteModal = (expense: MockExpense) => {
    setSelectedExpense(expense);
    setIsDeleteOpen(true);
  };

  const handleSave = () => {
    setFormError('');
    if (!formData.date || !formData.description.trim() || !formData.amount) {
      setFormError('All fields are required.');
      return;
    }

    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt <= 0) {
      setFormError('Amount must be greater than 0.');
      return;
    }

    setIsSubmitting(true);
    // Simulate network delay
    setTimeout(() => {
      if (selectedExpense) {
        expenseService.updateExpense(selectedExpense.id, {
          category: formData.category,
          description: formData.description,
          amount: rupeesToPaise(amt),
          expenseDate: formData.date
        });
        auditService.logAction(user?.id || 'admin', user?.fullName || 'Admin', 'UPDATE_EXPENSE', 'EXPENSE', selectedExpense.id, `Updated expense: ${formData.description}`);
        toast.success('Expense updated successfully.');
      } else {
        const newExpense = expenseService.createExpense({
          category: formData.category,
          description: formData.description,
          amount: rupeesToPaise(amt),
          expenseDate: formData.date,
          createdBy: user?.id || 'admin'
        });
        auditService.logAction(user?.id || 'admin', user?.fullName || 'Admin', 'CREATE_EXPENSE', 'EXPENSE', newExpense?.id || null, `Created expense: ${formData.description}`);
        toast.success('Expense added successfully.');
      }
      loadExpenses();
      setIsSubmitting(false);
      setIsModalOpen(false);
    }, 400);
  };

  const handleDelete = () => {
    if (!selectedExpense) return;
    setIsSubmitting(true);
    setTimeout(() => {
      auditService.logAction(user?.id || 'admin', user?.fullName || 'Admin', 'DELETE_EXPENSE', 'EXPENSE', selectedExpense.id, `Deleted expense: ${selectedExpense.description}`);
      expenseService.deleteExpense(selectedExpense.id);
      toast.success('Expense deleted successfully.');
      loadExpenses();
      setIsSubmitting(false);
      setIsDeleteOpen(false);
    }, 400);
  };

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Expenses</h1>
          <p className="text-sm text-gray-400 mt-1">
            Track and manage CUT&STYLE business expenses.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#c5a880] hover:bg-[#d6be9a] text-black font-semibold text-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#15171e] border border-white/10 rounded-2xl p-5 hover:border-red-500/30 transition-colors">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Total Expenses</div>
          <div className="text-2xl font-bold text-white">{formatRupeesCompact(totalStats.totalExpenses)}</div>
        </div>
        <div className="bg-[#15171e] border border-white/10 rounded-2xl p-5 hover:border-red-500/30 transition-colors">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">This Month</div>
          <div className="text-2xl font-bold text-white">{formatRupeesCompact(monthStats.totalExpenses)}</div>
        </div>
        <div className="bg-[#15171e] border border-white/10 rounded-2xl p-5 hover:border-red-500/30 transition-colors">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Today</div>
          <div className="text-2xl font-bold text-white">{formatRupeesCompact(todayStats.totalExpenses)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {/* Filters */}
          <div className="bg-[#15171e] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search description or category..."
                className="w-full bg-[#1b1d26] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] transition-all"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-[#1b1d26] border border-white/10 rounded-xl px-3 py-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value as FilterDate)}
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
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value as FilterCategory)}
                  className="bg-transparent text-sm text-gray-300 focus:outline-none capitalize"
                >
                  <option value="ALL">All Categories</option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c.toLowerCase()}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#15171e] border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#1b1d26] text-gray-400">
                  <tr>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Category</th>
                    <th className="px-6 py-4 font-medium">Description</th>
                    <th className="px-6 py-4 font-medium text-right">Amount</th>
                    <th className="px-6 py-4 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <WalletCards className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                        <p className="text-gray-500">No expenses match your filters.</p>
                        { (query || dateFilter !== 'all' || categoryFilter !== 'ALL') && (
                          <button onClick={() => { setQuery(''); setDateFilter('all'); setCategoryFilter('ALL'); }} className="mt-3 text-[#c5a880] hover:underline text-sm font-medium">
                            Clear Filters
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map(expense => (
                      <tr key={expense.id} className="hover:bg-white/[0.02]">
                        <td className="px-6 py-4 text-gray-300">{formatDate(expense.expenseDate)}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gray-800 text-gray-300 border border-gray-700">
                            {expense.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white truncate max-w-[200px]">{expense.description}</td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-[#c5a880]">
                          {formatRupeesCompact(expense.amount)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => openEditModal(expense)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => openDeleteModal(expense)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-950/30 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Breakdown Sidebar */}
        <div className="bg-[#15171e] border border-white/10 rounded-2xl p-6 h-fit">
          <h2 className="text-sm font-semibold text-white mb-4">Category Breakdown</h2>
          {breakdownData.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-10">No data for selected filters</p>
          ) : (
            <>
              <div className="h-[200px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={breakdownData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                      {breakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: number) => formatRupeesCompact(val)}
                      contentStyle={{ backgroundColor: '#1b1d26', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 mt-4">
                {breakdownData.map(b => (
                  <div key={b.name} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: b.color }} />
                      <span className="text-gray-300 capitalize">{b.name.toLowerCase()}</span>
                    </div>
                    <span className="font-mono text-white">{formatRupeesCompact(b.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#15171e] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-lg font-bold text-white">{selectedExpense ? 'Edit Expense' : 'Add Expense'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}
              
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Expense Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full bg-[#1b1d26] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value as ExpenseCategory})}
                  className="w-full bg-[#1b1d26] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] outline-none capitalize"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c.toLowerCase()}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="e.g. Monthly shop rent"
                  className="w-full bg-[#1b1d26] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  placeholder="0.00"
                  className="w-full bg-[#1b1d26] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] outline-none"
                />
              </div>

              <div className="pt-4">
                <button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-[#c5a880] hover:bg-[#d6be9a] text-black font-bold text-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (selectedExpense ? 'Updating...' : 'Saving...') : (selectedExpense ? 'Update Expense' : 'Save Expense')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#15171e] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center space-y-6">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Delete Expense</h3>
              <p className="text-sm text-gray-400 mt-2">Are you sure you want to delete this expense? This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsDeleteOpen(false)}
                disabled={isSubmitting}
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
