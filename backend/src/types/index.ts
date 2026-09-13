export type UserRole = 'ADMIN' | 'WORKER';
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type PaymentMethod = 'CASH' | 'UPI';

export type ExpenseCategory =
  | 'RENT'
  | 'ELECTRICITY'
  | 'WATER'
  | 'SALARY'
  | 'PRODUCTS'
  | 'MAINTENANCE'
  | 'MARKETING'
  | 'OTHER';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface AuthenticatedUser {
  id: string;
  email?: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
}

export interface BillItem {
  id: string;
  bill_id: string;
  description: string;
  amount: number;
  created_at: string;
}

export interface Bill {
  id: string;
  bill_number: string;
  worker_id: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: PaymentMethod;
  created_at: string;
  items?: BillItem[];
}

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  created_by: string;
  expense_date: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  description: string;
  created_at: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
