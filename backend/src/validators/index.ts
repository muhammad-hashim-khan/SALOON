import { z } from 'zod';

export const PaymentMethodEnum = z.enum(['CASH', 'UPI']);
export const UserRoleEnum = z.enum(['ADMIN', 'WORKER']);
export const UserStatusEnum = z.enum(['ACTIVE', 'INACTIVE']);

export const ExpenseCategoryEnum = z.enum([
  'RENT',
  'ELECTRICITY',
  'WATER',
  'SALARY',
  'PRODUCTS',
  'MAINTENANCE',
  'MARKETING',
  'OTHER',
]);

// Bill Item validation
export const billItemSchema = z.object({
  description: z.string().min(1, 'Item description is required'),
  amount: z.number().positive('Item amount must be greater than 0'),
});

// Bill creation validation
export const createBillSchema = z.object({
  body: z.object({
    customer_name: z.string().optional().nullable(),
    customer_phone: z.string().optional().nullable(),
    discount: z.number().nonnegative('Discount cannot be negative').default(0),
    payment_method: PaymentMethodEnum,
    items: z.array(billItemSchema).min(1, 'At least one bill item is required'),
  }),
});

// Expense creation validation
export const createExpenseSchema = z.object({
  body: z.object({
    category: ExpenseCategoryEnum,
    description: z.string().min(1, 'Expense description is required'),
    amount: z.number().positive('Expense amount must be positive'),
    expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD'),
  }),
});

// Profile update validation
export const updateProfileSchema = z.object({
  body: z.object({
    full_name: z.string().min(1, 'Full name is required').optional(),
    role: UserRoleEnum.optional(),
    status: UserStatusEnum.optional(),
  }),
});
