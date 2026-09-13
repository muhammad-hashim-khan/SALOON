import * as XLSX from 'xlsx';
import { reportService, ReportDateRange } from '../../services/reportService';
import { formatReportDateRange, formatMoneyNumber, formatDateTime, formatDateOnly } from './reportFormatters';
import { settingsService } from '../../services/settingsService';

export function downloadExcelReport(range: ReportDateRange, customFrom?: string, customTo?: string) {
  const dateStr = formatReportDateRange(range, customFrom, customTo);
  const fin = reportService.getFinancialSummary(range, customFrom, customTo);
  const sales = reportService.getSalesReport(range, customFrom, customTo);
  const expenses = reportService.getExpenseReport(range, customFrom, customTo);
  const workers = reportService.getWorkerReport(range, customFrom, customTo);
  
  const settings = settingsService.getSettings();
  const wb = XLSX.utils.book_new();
  
  // Sheet 1: Summary
  const summaryData = [
    [`${settings.salonName} - Financial Summary`],
    ['Date Range', dateStr],
    [],
    ['Total Sales', formatMoneyNumber(fin.totalSales)],
    ['Total Expenses', formatMoneyNumber(fin.totalExpenses)],
    ['Estimated Net', formatMoneyNumber(fin.estimatedNet)],
    [],
    ['Cash Sales', formatMoneyNumber(fin.cashSales)],
    ['UPI Sales', formatMoneyNumber(fin.upiSales)],
    [],
    ['Total Bills', fin.numberOfBills],
    ['Total Expenses Count', fin.numberOfExpenses]
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
  
  // Sheet 2: Sales
  const salesData = sales.bills.map(b => ({
    'Bill Number': b.billNumber,
    'Date': formatDateTime(b.createdAt),
    'Customer': b.customerName || 'Walk-in',
    'Worker ID': b.workerId,
    'Subtotal': formatMoneyNumber(b.subtotal),
    'Discount': formatMoneyNumber(b.discount),
    'Total': formatMoneyNumber(b.total),
    'Payment Method': b.paymentMethod
  }));
  const wsSales = XLSX.utils.json_to_sheet(salesData);
  XLSX.utils.book_append_sheet(wb, wsSales, 'Sales');

  // Sheet 3: Expenses
  const expData = expenses.expenses.map(e => ({
    'Date': formatDateOnly(e.expenseDate),
    'Category': e.category,
    'Description': e.description,
    'Amount': formatMoneyNumber(e.amount),
    'Created By': e.createdBy
  }));
  const wsExpenses = XLSX.utils.json_to_sheet(expData);
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses');
  
  // Sheet 4: Workers
  const workerData = workers.workerPerformance.map(w => ({
    'Worker Name': w.workerName,
    'Bills': w.totalBills,
    'Total Sales': formatMoneyNumber(w.totalSales),
    'Cash Sales': formatMoneyNumber(w.cashSales),
    'UPI Sales': formatMoneyNumber(w.upiSales),
    'Average Bill': formatMoneyNumber(w.averageBill)
  }));
  const wsWorkers = XLSX.utils.json_to_sheet(workerData);
  XLSX.utils.book_append_sheet(wb, wsWorkers, 'Workers');

  XLSX.writeFile(wb, `${settings.salonName.replace(/ /g, '_')}_Report_${dateStr.replace(/ /g, '_')}.xlsx`);
}
