import { billingService } from './billingService';
import { expenseService } from './expenseService';
import { workerService } from './workerService';
import { calcWorkerPerformance } from '../utils/analytics';

export type ReportDateRange = 'today' | 'yesterday' | '7days' | 'month' | 'lastMonth' | 'last3Months' | 'custom';

export interface AccountingReport {
  executive: {
    totalSales: number;
    totalExpenses: number;
    netCashFlow: number;
    totalBills: number;
    averageBill: number;
    cashSales: number;
    upiSales: number;
    otherSales: number;
  };
  cash: {
    openingBalance: null | number;
    cashSales: number;
    cashExpenses: number;
    closingBalance: number;
  };
  paymentMethods: { method: string; count: number; total: number; percent: number }[];
  expenseCategories: { category: string; count: number; total: number; percent: number }[];
  dailyBreakdown: { date: string; bills: number; cash: number; upi: number; total: number }[];
  workerSummary: { workerName: string; bills: number; cash: number; upi: number; total: number; avg: number }[];
  transactions: {
    bills: any[];
    expenses: any[];
  };
}

export function getDateBoundaries(range: ReportDateRange, customFrom?: string, customTo?: string): { start: number, end: number } {
  const now = new Date();
  let start = 0;
  let end = Number.MAX_SAFE_INTEGER;

  switch (range) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
      break;
    case 'yesterday':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999).getTime();
      break;
    case '7days':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).getTime();
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
      break;
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
      break;
    case 'lastMonth':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime();
      break;
    case 'last3Months':
      start = new Date(now.getFullYear(), now.getMonth() - 3, 1).getTime();
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
      break;
    case 'custom':
      if (customFrom) start = new Date(customFrom).getTime();
      if (customTo) {
        const toDate = new Date(customTo);
        toDate.setHours(23, 59, 59, 999);
        end = toDate.getTime();
      }
      break;
  }
  return { start, end };
}

async function getFilteredData(range: ReportDateRange, customFrom?: string, customTo?: string) {
  const { start, end } = getDateBoundaries(range, customFrom, customTo);
  
  const allBills = await billingService.getBills();
  const bills = allBills.filter(b => {
    const t = new Date(b.createdAt).getTime();
    return t >= start && t <= end;
  });

  const allExpenses = await expenseService.getExpenses();
  const expenses = allExpenses.filter(e => {
    const t = new Date(e.expenseDate).getTime();
    return t >= start && t <= end;
  });

  return { bills, expenses };
}

export const reportService = {
  async getSalesReport(range: ReportDateRange, customFrom?: string, customTo?: string, paymentMethod?: string, workerId?: string) {
    let { bills } = await getFilteredData(range, customFrom, customTo);
    
    if (paymentMethod && paymentMethod !== 'ALL') {
      bills = bills.filter(b => b.paymentMethod === paymentMethod);
    }
    
    if (workerId && workerId !== 'ALL') {
      bills = bills.filter(b => b.workerId === workerId);
    }
    
    bills.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const totalSales = bills.reduce((sum, b) => sum + b.total, 0);
    const totalBills = bills.length;
    const averageBill = totalBills > 0 ? Math.round(totalSales / totalBills) : 0;
    
    return { bills, totalSales, totalBills, averageBill };
  },

  async getExpenseReport(range: ReportDateRange, customFrom?: string, customTo?: string, category?: string) {
    let { expenses } = await getFilteredData(range, customFrom, customTo);
    
    if (category && category !== 'ALL') {
      expenses = expenses.filter(e => e.category === category);
    }
    
    expenses.sort((a, b) => {
      const cmp = b.expenseDate.localeCompare(a.expenseDate);
      if (cmp !== 0) return cmp;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const numberOfExpenses = expenses.length;
    const averageExpense = numberOfExpenses > 0 ? Math.round(totalExpenses / numberOfExpenses) : 0;
    
    // Category Breakdown
    const map = new Map<string, { count: number, total: number }>();
    for (const e of expenses) {
      if (!map.has(e.category)) {
        map.set(e.category, { count: 0, total: 0 });
      }
      const item = map.get(e.category)!;
      item.count++;
      item.total += e.amount;
    }
    
    const categoryBreakdown = Array.from(map.entries()).map(([cat, data]) => ({
      category: cat,
      count: data.count,
      total: data.total,
      percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0
    })).sort((a, b) => b.total - a.total);
    
    return { expenses, totalExpenses, numberOfExpenses, averageExpense, categoryBreakdown };
  },

  async getPaymentReport(range: ReportDateRange, customFrom?: string, customTo?: string) {
    const { bills } = await getFilteredData(range, customFrom, customTo);
    
    let cashSales = 0;
    let upiSales = 0;
    let totalSales = 0;
    
    for (const b of bills) {
      totalSales += b.total;
      if (b.paymentMethod === 'CASH') cashSales += b.total;
      else if (b.paymentMethod === 'UPI') upiSales += b.total;
    }
    
    const cashPercent = totalSales > 0 ? (cashSales / totalSales) * 100 : 0;
    const upiPercent = totalSales > 0 ? (upiSales / totalSales) * 100 : 0;
    
    return { cashSales, upiSales, totalSales, cashPercent, upiPercent };
  },

  async getWorkerReport(range: ReportDateRange, customFrom?: string, customTo?: string) {
    const { bills } = await getFilteredData(range, customFrom, customTo);
    const workers = await workerService.getWorkers();
    
    const perf = calcWorkerPerformance(bills);
    
    // Merge with all workers to ensure 0-bill workers are included
    const result = workers.map(w => {
      const found = perf.find(p => p.workerId === w.id);
      if (found) {
        return {
          ...found,
          averageBill: found.totalBills > 0 ? Math.round(found.totalSales / found.totalBills) : 0
        };
      }
      return {
        workerId: w.id,
        workerName: w.fullName,
        totalBills: 0,
        totalSales: 0,
        cashSales: 0,
        upiSales: 0,
        averageBill: 0
      };
    });
    
    result.sort((a, b) => b.totalSales - a.totalSales);
    return { workerPerformance: result };
  },

  async getFinancialSummary(range: ReportDateRange, customFrom?: string, customTo?: string) {
    const { bills, expenses } = await getFilteredData(range, customFrom, customTo);
    
    let totalSales = 0;
    let cashSales = 0;
    let upiSales = 0;
    
    for (const b of bills) {
      totalSales += b.total;
      if (b.paymentMethod === 'CASH') cashSales += b.total;
      else if (b.paymentMethod === 'UPI') upiSales += b.total;
    }
    
    let totalExpenses = 0;
    for (const e of expenses) {
      totalExpenses += e.amount;
    }
    
    const estimatedNet = totalSales - totalExpenses;
    
    return {
      totalSales,
      totalExpenses,
      estimatedNet,
      cashSales,
      upiSales,
      numberOfBills: bills.length,
      numberOfExpenses: expenses.length
    };
  },

  async getSalesVsExpenses(range: ReportDateRange, customFrom?: string, customTo?: string) {
    const { start, end } = getDateBoundaries(range, customFrom, customTo);
    const { bills, expenses } = await getFilteredData(range, customFrom, customTo);
    
    const map = new Map<string, { sales: number, expenses: number }>();
    
    const MAX_DAYS = 90;
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= MAX_DAYS && diffDays > 0) {
      for (let i = 0; i <= diffDays; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        if (d.getTime() > end) break;
        map.set(d.toISOString().slice(0, 10), { sales: 0, expenses: 0 });
      }
    }
    
    for (const b of bills) {
      const date = b.createdAt.slice(0, 10);
      if (!map.has(date)) map.set(date, { sales: 0, expenses: 0 });
      map.get(date)!.sales += b.total;
    }
    
    for (const e of expenses) {
      const date = e.expenseDate;
      if (!map.has(date)) map.set(date, { sales: 0, expenses: 0 });
      map.get(date)!.expenses += e.amount;
    }
    
    const points = Array.from(map.entries()).map(([date, data]) => {
      const d = new Date(date);
      return {
        date,
        label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        sales: data.sales,
        expenses: data.expenses
      };
    }).sort((a, b) => a.date.localeCompare(b.date));
    
    return { points };
  },

  async getAccountingReport(range: ReportDateRange, customFrom?: string, customTo?: string) {
    const { start, end } = getDateBoundaries(range, customFrom, customTo);
    
    const [allBills, allExpenses, allWorkers] = await Promise.all([
      billingService.getBills(),
      expenseService.getExpenses(),
      workerService.getWorkers()
    ]);
    
    const bills = allBills.filter(b => {
      const t = new Date(b.createdAt).getTime();
      return t >= start && t <= end;
    });
    
    const expenses = allExpenses.filter(e => {
      const t = new Date(e.expenseDate).getTime();
      return t >= start && t <= end;
    });
    
    // Sort transactions
    bills.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    expenses.sort((a, b) => {
      const cmp = b.expenseDate.localeCompare(a.expenseDate);
      if (cmp !== 0) return cmp;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    let totalSales = 0;
    let cashSales = 0;
    let upiSales = 0;
    const paymentMethods = new Map<string, { count: number, total: number }>();
    
    for (const b of bills) {
      totalSales += b.total;
      if (b.paymentMethod === 'CASH') cashSales += b.total;
      else if (b.paymentMethod === 'UPI') upiSales += b.total;
      
      const method = b.paymentMethod || 'OTHER';
      if (!paymentMethods.has(method)) paymentMethods.set(method, { count: 0, total: 0 });
      paymentMethods.get(method)!.count++;
      paymentMethods.get(method)!.total += b.total;
    }
    
    let totalExpenses = 0;
    let cashExpenses = 0;
    const expenseCategories = new Map<string, { count: number, total: number }>();
    
    for (const e of expenses) {
      totalExpenses += e.amount;
      // Assuming all expenses are cash if not specified, since app doesn't currently track expense payment method
      cashExpenses += e.amount; 
      
      const cat = e.category || 'OTHER';
      if (!expenseCategories.has(cat)) expenseCategories.set(cat, { count: 0, total: 0 });
      expenseCategories.get(cat)!.count++;
      expenseCategories.get(cat)!.total += e.amount;
    }

    const netCashFlow = totalSales - totalExpenses;
    const averageBill = bills.length > 0 ? Math.round(totalSales / bills.length) : 0;
    
    // Day by Day
    const dailyMap = new Map<string, { bills: number, cash: number, upi: number, total: number }>();
    const diffDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    
    if (diffDays <= 366) {
      for (let i = 0; i <= diffDays; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        if (d.getTime() > end) break;
        dailyMap.set(d.toISOString().slice(0, 10), { bills: 0, cash: 0, upi: 0, total: 0 });
      }
    }
    
    for (const b of bills) {
      const date = b.createdAt.slice(0, 10);
      if (!dailyMap.has(date)) dailyMap.set(date, { bills: 0, cash: 0, upi: 0, total: 0 });
      const day = dailyMap.get(date)!;
      day.bills++;
      day.total += b.total;
      if (b.paymentMethod === 'CASH') day.cash += b.total;
      else if (b.paymentMethod === 'UPI') day.upi += b.total;
    }

    const dailyBreakdown = Array.from(dailyMap.entries()).map(([date, data]) => ({ date, ...data })).sort((a, b) => a.date.localeCompare(b.date));

    // Worker Summary
    const workerPerf = calcWorkerPerformance(bills);
    const workerSummary = allWorkers.map(w => {
      const found = workerPerf.find(p => p.workerId === w.id);
      if (found) {
        return {
          workerName: w.fullName,
          bills: found.totalBills,
          cash: found.cashSales,
          upi: found.upiSales,
          total: found.totalSales,
          avg: found.totalBills > 0 ? Math.round(found.totalSales / found.totalBills) : 0
        };
      }
      return { workerName: w.fullName, bills: 0, cash: 0, upi: 0, total: 0, avg: 0 };
    }).sort((a, b) => b.total - a.total);

    return {
      executive: {
        totalSales,
        totalExpenses,
        netCashFlow,
        totalBills: bills.length,
        averageBill,
        cashSales,
        upiSales,
        otherSales: totalSales - cashSales - upiSales
      },
      cash: {
        openingBalance: null, // "Not Recorded"
        cashSales,
        cashExpenses,
        closingBalance: cashSales - cashExpenses // Operational
      },
      paymentMethods: Array.from(paymentMethods.entries()).map(([method, data]) => ({
        method,
        count: data.count,
        total: data.total,
        percent: totalSales > 0 ? (data.total / totalSales) * 100 : 0
      })).sort((a, b) => b.total - a.total),
      expenseCategories: Array.from(expenseCategories.entries()).map(([category, data]) => ({
        category,
        count: data.count,
        total: data.total,
        percent: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0
      })).sort((a, b) => b.total - a.total),
      dailyBreakdown,
      workerSummary,
      transactions: {
        bills: bills.map(b => ({
          ...b,
          workerName: allWorkers.find(w => w.id === b.workerId)?.fullName || 'Unknown'
        })),
        expenses
      }
    };
  }
};
