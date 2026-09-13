import { ReportDateRange } from '../../services/reportService';

export function formatMoney(paise: number): string {
  // Simple format for export, maybe without the symbol or with symbol
  return `Rs. ${(paise / 100).toFixed(2)}`;
}

export function formatMoneyNumber(paise: number): number {
  return paise / 100;
}

export function formatReportDateRange(range: ReportDateRange, customFrom?: string, customTo?: string): string {
  if (range === 'today') return 'Today';
  if (range === 'yesterday') return 'Yesterday';
  if (range === '7days') return 'Last 7 Days';
  if (range === 'month') return 'This Month';
  if (range === 'lastMonth') return 'Last Month';
  if (range === 'last3Months') return 'Last 3 Months';
  
  if (range === 'custom') {
    if (customFrom && customTo) {
      return `${customFrom} to ${customTo}`;
    }
    return 'Custom Range';
  }
  return 'All Time';
}

export function formatDateTime(isoStr: string): string {
  return new Date(isoStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export function formatDateOnly(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}
