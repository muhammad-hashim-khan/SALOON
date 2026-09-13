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

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: UserRole;
          status: UserStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role?: UserRole;
          status?: UserStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: UserRole;
          status?: UserStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      bills: {
        Row: {
          id: string;
          bill_number: string;
          worker_id: string;
          customer_name: string | null;
          customer_phone: string | null;
          subtotal: number;
          discount: number;
          total: number;
          payment_method: PaymentMethod;
          created_at: string;
        };
        Insert: {
          id?: string;
          bill_number?: string;
          worker_id: string;
          customer_name?: string | null;
          customer_phone?: string | null;
          subtotal: number;
          discount?: number;
          total: number;
          payment_method: PaymentMethod;
          created_at?: string;
        };
        Update: {
          id?: string;
          bill_number?: string;
          worker_id?: string;
          customer_name?: string | null;
          customer_phone?: string | null;
          subtotal?: number;
          discount?: number;
          total?: number;
          payment_method?: PaymentMethod;
          created_at?: string;
        };
      };
      bill_items: {
        Row: {
          id: string;
          bill_id: string;
          description: string;
          amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          bill_id: string;
          description: string;
          amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          bill_id?: string;
          description?: string;
          amount?: number;
          created_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          category: ExpenseCategory;
          description: string;
          amount: number;
          created_by: string;
          expense_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category: ExpenseCategory;
          description: string;
          amount: number;
          created_by: string;
          expense_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category?: ExpenseCategory;
          description?: string;
          amount?: number;
          created_by?: string;
          expense_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id: string | null;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          description: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          description?: string;
          created_at?: string;
        };
      };
    };
  };
}
