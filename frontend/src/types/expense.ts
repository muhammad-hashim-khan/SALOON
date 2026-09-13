// ExpenseCategory is a plain string union — not from the DB generated types
export type ExpenseCategory = 'RENT' | 'ELECTRICITY' | 'WATER' | 'SALARY' | 'PRODUCTS' | 'MAINTENANCE' | 'MARKETING' | 'OTHER';

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
