"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = exports.createExpenseSchema = exports.createBillSchema = exports.billItemSchema = exports.ExpenseCategoryEnum = exports.UserStatusEnum = exports.UserRoleEnum = exports.PaymentMethodEnum = void 0;
const zod_1 = require("zod");
exports.PaymentMethodEnum = zod_1.z.enum(['CASH', 'UPI']);
exports.UserRoleEnum = zod_1.z.enum(['ADMIN', 'WORKER']);
exports.UserStatusEnum = zod_1.z.enum(['ACTIVE', 'INACTIVE']);
exports.ExpenseCategoryEnum = zod_1.z.enum([
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
exports.billItemSchema = zod_1.z.object({
    description: zod_1.z.string().min(1, 'Item description is required'),
    amount: zod_1.z.number().positive('Item amount must be greater than 0'),
});
// Bill creation validation
exports.createBillSchema = zod_1.z.object({
    body: zod_1.z.object({
        customer_name: zod_1.z.string().optional().nullable(),
        customer_phone: zod_1.z.string().optional().nullable(),
        discount: zod_1.z.number().nonnegative('Discount cannot be negative').default(0),
        payment_method: exports.PaymentMethodEnum,
        items: zod_1.z.array(exports.billItemSchema).min(1, 'At least one bill item is required'),
    }),
});
// Expense creation validation
exports.createExpenseSchema = zod_1.z.object({
    body: zod_1.z.object({
        category: exports.ExpenseCategoryEnum,
        description: zod_1.z.string().min(1, 'Expense description is required'),
        amount: zod_1.z.number().positive('Expense amount must be positive'),
        expense_date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD'),
    }),
});
// Profile update validation
exports.updateProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        full_name: zod_1.z.string().min(1, 'Full name is required').optional(),
        role: exports.UserRoleEnum.optional(),
        status: exports.UserStatusEnum.optional(),
    }),
});
