/**
 * Billing Domain Types
 * These types are shared across billingService, UI components, and mock data.
 */

export type PaymentMethod = 'CASH' | 'UPI';

export interface MockBillItem {
  id: string;
  description: string;
  amount: number; // stored in paise (integer) for precision; /100 when displaying
}

export interface MockBill {
  id: string;
  billNumber: string;
  workerId: string;
  workerName: string;
  customerName: string;
  customerPhone: string;
  items: MockBillItem[];
  subtotal: number;   // paise
  discount: number;   // paise
  total: number;      // paise
  paymentMethod: PaymentMethod;
  createdAt: string; // ISO 8601
}

export interface CreateBillInput {
  workerId: string;
  workerName: string;
  customerName: string;
  customerPhone: string;
  items: { description: string; amount: number }[]; // amount in paise
  discount: number; // paise
  paymentMethod: PaymentMethod;
}
