import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { reportService, ReportDateRange } from '../../services/reportService';
import { formatMoney, formatReportDateRange, formatDateTime, formatDateOnly } from './reportFormatters';
import { MockExpense } from '../../types/expense';
import { MockBill } from '../../types/billing';
import { settingsService } from '../../services/settingsService';

export function downloadSalesPDF(range: ReportDateRange, customFrom?: string, customTo?: string, paymentMethod?: string, workerId?: string) {
  const doc = new jsPDF();
  const dateStr = formatReportDateRange(range, customFrom, customTo);
  const data = reportService.getSalesReport(range, customFrom, customTo, paymentMethod, workerId);

  const settings = settingsService.getSettings();

  // Header
  doc.setFontSize(20);
  doc.text(settings.salonName, 14, 22);
  doc.setFontSize(10);
  doc.text(settings.businessName, 14, 28);
  doc.setFontSize(14);
  doc.text('Sales Report', 14, 40);
  doc.setFontSize(10);
  doc.text(`Date Range: ${dateStr}`, 14, 46);
  doc.text(`Generated On: ${formatDateTime(new Date().toISOString())}`, 14, 52);

  // Summary
  doc.text(`Total Sales: ${formatMoney(data.totalSales)}`, 14, 62);
  doc.text(`Total Bills: ${data.totalBills}`, 14, 68);
  doc.text(`Average Bill: ${formatMoney(data.averageBill)}`, 14, 74);

  // Table
  autoTable(doc, {
    startY: 82,
    head: [['Bill Number', 'Date', 'Customer', 'Worker', 'Payment', 'Amount']],
    body: data.bills.map((b: MockBill) => [
      b.billNumber,
      formatDateTime(b.createdAt),
      b.customerName || 'Walk-in',
      b.workerId, // Ideally worker name, but we only have ID here directly
      b.paymentMethod,
      formatMoney(b.total)
    ]),
  });

  doc.save(`${settings.salonName.replace(/ /g, '_')}_Sales_${dateStr.replace(/ /g, '_')}.pdf`);
}

export function downloadExpensePDF(range: ReportDateRange, customFrom?: string, customTo?: string, category?: string) {
  const doc = new jsPDF();
  const dateStr = formatReportDateRange(range, customFrom, customTo);
  const data = reportService.getExpenseReport(range, customFrom, customTo, category);

  const settings = settingsService.getSettings();

  doc.setFontSize(20);
  doc.text(settings.salonName, 14, 22);
  doc.setFontSize(10);
  doc.text(settings.businessName, 14, 28);
  doc.setFontSize(14);
  doc.text('Expense Report', 14, 40);
  doc.setFontSize(10);
  doc.text(`Date Range: ${dateStr}`, 14, 46);
  doc.text(`Generated On: ${formatDateTime(new Date().toISOString())}`, 14, 52);

  doc.text(`Total Expenses: ${formatMoney(data.totalExpenses)}`, 14, 62);
  doc.text(`Count: ${data.numberOfExpenses}`, 14, 68);

  autoTable(doc, {
    startY: 76,
    head: [['Date', 'Category', 'Description', 'Amount']],
    body: data.expenses.map((e: MockExpense) => [
      formatDateOnly(e.expenseDate),
      e.category,
      e.description,
      formatMoney(e.amount)
    ]),
  });

  doc.save(`${settings.salonName.replace(/ /g, '_')}_Expenses_${dateStr.replace(/ /g, '_')}.pdf`);
}

export function downloadFinancialSummaryPDF(range: ReportDateRange, customFrom?: string, customTo?: string) {
  const doc = new jsPDF();
  const dateStr = formatReportDateRange(range, customFrom, customTo);
  const data = reportService.getFinancialSummary(range, customFrom, customTo);

  const settings = settingsService.getSettings();

  doc.setFontSize(20);
  doc.text(settings.salonName, 14, 22);
  doc.setFontSize(10);
  doc.text(settings.businessName, 14, 28);
  
  doc.setFontSize(16);
  doc.text('Financial Summary', 14, 45);
  doc.setFontSize(11);
  doc.text(dateStr, 14, 52);
  
  doc.line(14, 56, 196, 56);

  doc.setFontSize(12);
  doc.text('Sales', 14, 70);
  doc.text(formatMoney(data.totalSales), 150, 70, { align: 'right' });
  
  doc.text('Expenses', 14, 80);
  doc.text(formatMoney(data.totalExpenses), 150, 80, { align: 'right' });
  
  doc.setFont('helvetica', 'bold');
  doc.text('Estimated Net', 14, 90);
  doc.text(formatMoney(data.estimatedNet), 150, 90, { align: 'right' });
  doc.setFont('helvetica', 'normal');

  doc.line(14, 96, 196, 96);

  doc.text('Cash Sales', 14, 110);
  doc.text(formatMoney(data.cashSales), 150, 110, { align: 'right' });
  
  doc.text('UPI Sales', 14, 120);
  doc.text(formatMoney(data.upiSales), 150, 120, { align: 'right' });

  doc.line(14, 126, 196, 126);

  doc.text('Total Bills', 14, 140);
  doc.text(data.numberOfBills.toString(), 150, 140, { align: 'right' });
  
  doc.text('Total Expenses', 14, 150);
  doc.text(data.numberOfExpenses.toString(), 150, 150, { align: 'right' });
  
  doc.setFontSize(9);
  doc.text(`Generated On: ${formatDateTime(new Date().toISOString())}`, 14, 170);

  doc.save(`${settings.salonName.replace(/ /g, '_')}_Financial_Summary_${dateStr.replace(/ /g, '_')}.pdf`);
}
