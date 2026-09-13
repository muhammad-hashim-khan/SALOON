import { ExpenseCategory } from './database';
export type { ExpenseCategory };

export interface MockExpense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number; // in paise
  expenseDate: string; // YYYY-MM-DD
  createdBy: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
