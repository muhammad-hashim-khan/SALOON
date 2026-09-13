import { Database } from './database';
export * from './database';
export * from './expense';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Bill = Database['public']['Tables']['bills']['Row'];
export type BillItem = Database['public']['Tables']['bill_items']['Row'];
export type Expense = Database['public']['Tables']['expenses']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];

// App-level role/status types
export type UserRole = 'ADMIN' | 'WORKER';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface UserSession {
  id: string;
  email?: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
}

export interface NavItem {
  label: string;
  href: string;
  iconName: string;
  badge?: string;
}
