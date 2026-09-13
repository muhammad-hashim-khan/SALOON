import Papa from 'papaparse';
import { reportService, ReportDateRange } from '../../services/reportService';
import { formatReportDateRange, formatMoneyNumber, formatDateTime, formatDateOnly } from './reportFormatters';
import { settingsService } from '../../services/settingsService';

export async function downloadSalesCSV(range: ReportDateRange, customFrom?: string, customTo?: string, paymentMethod?: string, workerId?: string) {
  const dateStr = formatReportDateRange(range, customFrom, customTo);
  const [data, settings] = await Promise.all([
    reportService.getSalesReport(range, customFrom, customTo, paymentMethod, workerId),
    settingsService.getSettings()
  ]);
  
  const csvData = data.bills.map(b => ({
    'Bill Number': b.billNumber,
    'Date': formatDateTime(b.createdAt),
    'Customer': b.customerName || 'Walk-in',
    'Worker': b.workerName,
    'Subtotal': formatMoneyNumber(b.subtotal),
    'Discount': formatMoneyNumber(b.discount),
    'Total': formatMoneyNumber(b.total),
    'Payment Method': b.paymentMethod
  }));
  
  const csv = Papa.unparse(csvData);
  downloadFile(csv, `${settings.salonName.replace(/ /g, '_')}_Sales_${dateStr.replace(/ /g, '_')}.csv`);
}

export async function downloadExpenseCSV(range: ReportDateRange, customFrom?: string, customTo?: string, category?: string) {
  const dateStr = formatReportDateRange(range, customFrom, customTo);
  const [data, settings] = await Promise.all([
    reportService.getExpenseReport(range, customFrom, customTo, category),
    settingsService.getSettings()
  ]);
  
  const csvData = data.expenses.map(e => ({
    'Date': formatDateOnly(e.expenseDate),
    'Category': e.category,
    'Description': e.description,
    'Amount': formatMoneyNumber(e.amount),
    'Created By': e.createdBy
  }));
  
  const csv = Papa.unparse(csvData);
  downloadFile(csv, `${settings.salonName.replace(/ /g, '_')}_Expenses_${dateStr.replace(/ /g, '_')}.csv`);
}

export async function downloadFinancialSummaryCSV(range: ReportDateRange, customFrom?: string, customTo?: string) {
  const dateStr = formatReportDateRange(range, customFrom, customTo);
  const [data, settings] = await Promise.all([
    reportService.getFinancialSummary(range, customFrom, customTo),
    settingsService.getSettings()
  ]);
  
  const csvData = [
    { 'Metric': 'Total Sales', 'Value': formatMoneyNumber(data.totalSales) },
    { 'Metric': 'Total Expenses', 'Value': formatMoneyNumber(data.totalExpenses) },
    { 'Metric': 'Estimated Net', 'Value': formatMoneyNumber(data.estimatedNet) },
    { 'Metric': 'Cash Sales', 'Value': formatMoneyNumber(data.cashSales) },
    { 'Metric': 'UPI Sales', 'Value': formatMoneyNumber(data.upiSales) },
    { 'Metric': 'Total Bills', 'Value': data.numberOfBills },
    { 'Metric': 'Total Expenses Count', 'Value': data.numberOfExpenses }
  ];
  
  const csv = Papa.unparse(csvData);
  downloadFile(csv, `${settings.salonName.replace(/ /g, '_')}_Financial_Summary_${dateStr.replace(/ /g, '_')}.csv`);
}

function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
