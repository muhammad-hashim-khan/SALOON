/**
 * Billing Analytics Utilities
 * Pure functions — no side effects, no localStorage calls.
 * All inputs come from billingService; outputs feed the UI.
 */

import { MockBill } from '../types/billing';
import { MockExpense } from '../types/expense';

// ─── Date range helpers ───────────────────────────────────────────────────────

export type DateRange = 'today' | 'yesterday' | '7days' | 'month';

export function getStartOf(range: DateRange): Date {
  const now = new Date();
  switch (range) {
    case 'today': {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'yesterday': {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case '7days': {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'month': {
      return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    }
  }
}

export function getEndOf(range: DateRange): Date {
  const now = new Date();
  if (range === 'yesterday') {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    d.setHours(23, 59, 59, 999);
    return d;
  }
  const d = new Date(now);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function filterByRange(bills: MockBill[], range: DateRange): MockBill[] {
  const start = getStartOf(range).getTime();
  const end = getEndOf(range).getTime();
  return bills.filter((b) => {
    const t = new Date(b.createdAt).getTime();
    return t >= start && t <= end;
  });
}

export function filterExpensesByRange(expenses: MockExpense[], range: DateRange): MockExpense[] {
  const start = getStartOf(range).getTime();
  const end = getEndOf(range).getTime();
  return expenses.filter((e) => {
    // using expenseDate for filtering or createdAt? 
    // The requirement is usually based on expenseDate, let's use expenseDate string YYYY-MM-DD to date.
    const t = new Date(e.expenseDate).getTime();
    return t >= start && t <= end;
  });
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface BillStats {
  totalBills: number;
  totalSales: number;  // paise
  cashSales: number;   // paise
  upiSales: number;    // paise
  cashBills: number;
  upiBills: number;
}

export function calcStats(bills: MockBill[]): BillStats {
  let totalSales = 0, cashSales = 0, upiSales = 0, cashBills = 0, upiBills = 0;
  for (const b of bills) {
    totalSales += b.total;
    if (b.paymentMethod === 'CASH') { cashSales += b.total; cashBills++; }
    else { upiSales += b.total; upiBills++; }
  }
  return { totalBills: bills.length, totalSales, cashSales, upiSales, cashBills, upiBills };
}

export interface ExpenseStats {
  totalExpenses: number; // paise
  count: number;
}

export function calcExpenseStats(expenses: MockExpense[]): ExpenseStats {
  let totalExpenses = 0;
  for (const e of expenses) {
    totalExpenses += e.amount;
  }
  return { totalExpenses, count: expenses.length };
}

export interface CategoryBreakdown {
  name: string;
  value: number; // paise
}

export function calcCategoryBreakdown(expenses: MockExpense[]): CategoryBreakdown[] {
  const map = new Map<string, number>();
  for (const e of expenses) {
    map.set(e.category, (map.get(e.category) || 0) + e.amount);
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

// ─── Chart data ───────────────────────────────────────────────────────────────

export interface ChartPoint {
  label: string;      // x-axis label
  date: string;       // YYYY-MM-DD for keying
  sales: number;      // paise
  bills: number;
  expenses: number;   // paise
}

export function buildChartData(bills: MockBill[], expenses: MockExpense[] = [], range: '7days' | 'month'): ChartPoint[] {
  const now = new Date();
  const points: ChartPoint[] = [];

  if (range === '7days') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
      const dayBills = bills.filter((b) => b.createdAt.slice(0, 10) === key);
      const dayExpenses = expenses.filter((e) => e.expenseDate === key);
      points.push({ 
        label, 
        date: key, 
        sales: dayBills.reduce((s, b) => s + b.total, 0), 
        bills: dayBills.length,
        expenses: dayExpenses.reduce((s, e) => s + e.amount, 0)
      });
    }
  } else {
    // Month: group by date
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const days = now.getDate(); // days elapsed this month
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const dayBills = bills.filter((b) => b.createdAt.slice(0, 10) === key);
      const dayExpenses = expenses.filter((e) => e.expenseDate === key);
      points.push({ 
        label, 
        date: key, 
        sales: dayBills.reduce((s, b) => s + b.total, 0), 
        bills: dayBills.length,
        expenses: dayExpenses.reduce((s, e) => s + e.amount, 0)
      });
    }
  }
  return points;
}

// ─── Worker performance ───────────────────────────────────────────────────────

export interface WorkerPerf {
  workerId: string;
  workerName: string;
  totalBills: number;
  totalSales: number; // paise
  cashSales: number;
  upiSales: number;
}

export function calcWorkerPerformance(bills: MockBill[]): WorkerPerf[] {
  const map = new Map<string, WorkerPerf>();
  for (const b of bills) {
    if (!map.has(b.workerId)) {
      map.set(b.workerId, {
        workerId: b.workerId,
        workerName: b.workerName,
        totalBills: 0,
        totalSales: 0,
        cashSales: 0,
        upiSales: 0,
      });
    }
    const entry = map.get(b.workerId)!;
    entry.totalBills++;
    entry.totalSales += b.total;
    if (b.paymentMethod === 'CASH') entry.cashSales += b.total;
    else entry.upiSales += b.total;
  }
  return Array.from(map.values()).sort((a, b) => b.totalSales - a.totalSales);
}
