import { MockExpense } from '../types/expense';

export const EXPENSES_STORAGE_KEY = 'cutandstyle_mock_expenses';

function daysAgoStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function daysAgoIso(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

const adminId = 'mock-admin-001';

export const seedMockExpenses: MockExpense[] = [
  // Today
  {
    id: 'exp-001',
    category: 'ELECTRICITY',
    description: 'Electricity bill for August',
    amount: 1250000, // ₹12,500
    expenseDate: daysAgoStr(0),
    createdBy: adminId,
    createdAt: daysAgoIso(0),
    updatedAt: daysAgoIso(0),
  },
  {
    id: 'exp-002',
    category: 'MAINTENANCE',
    description: 'AC servicing',
    amount: 250000, // ₹2,500
    expenseDate: daysAgoStr(0),
    createdBy: adminId,
    createdAt: daysAgoIso(0),
    updatedAt: daysAgoIso(0),
  },
  
  // Yesterday
  {
    id: 'exp-003',
    category: 'PRODUCTS',
    description: 'Shampoo and conditioners stock',
    amount: 850000, // ₹8,500
    expenseDate: daysAgoStr(1),
    createdBy: adminId,
    createdAt: daysAgoIso(1),
    updatedAt: daysAgoIso(1),
  },
  
  // Last 7 days
  {
    id: 'exp-004',
    category: 'MARKETING',
    description: 'Instagram ad boost',
    amount: 150000, // ₹1,500
    expenseDate: daysAgoStr(3),
    createdBy: adminId,
    createdAt: daysAgoIso(3),
    updatedAt: daysAgoIso(3),
  },
  {
    id: 'exp-005',
    category: 'WATER',
    description: 'Monthly water supply',
    amount: 80000, // ₹800
    expenseDate: daysAgoStr(5),
    createdBy: adminId,
    createdAt: daysAgoIso(5),
    updatedAt: daysAgoIso(5),
  },
  {
    id: 'exp-006',
    category: 'OTHER',
    description: 'Cleaning supplies',
    amount: 45000, // ₹450
    expenseDate: daysAgoStr(6),
    createdBy: adminId,
    createdAt: daysAgoIso(6),
    updatedAt: daysAgoIso(6),
  },

  // This month (assuming within 30 days)
  {
    id: 'exp-007',
    category: 'RENT',
    description: 'Monthly shop rent',
    amount: 4500000, // ₹45,000
    expenseDate: daysAgoStr(10),
    createdBy: adminId,
    createdAt: daysAgoIso(10),
    updatedAt: daysAgoIso(10),
  },
  {
    id: 'exp-008',
    category: 'SALARY',
    description: 'Advance salary - Rahul',
    amount: 500000, // ₹5,000
    expenseDate: daysAgoStr(12),
    createdBy: adminId,
    createdAt: daysAgoIso(12),
    updatedAt: daysAgoIso(12),
  },
  {
    id: 'exp-009',
    category: 'PRODUCTS',
    description: 'Hair color tubes',
    amount: 1400000, // ₹14,000
    expenseDate: daysAgoStr(15),
    createdBy: adminId,
    createdAt: daysAgoIso(15),
    updatedAt: daysAgoIso(15),
  },
  {
    id: 'exp-010',
    category: 'MAINTENANCE',
    description: 'Plumbing repair',
    amount: 120000, // ₹1,200
    expenseDate: daysAgoStr(18),
    createdBy: adminId,
    createdAt: daysAgoIso(18),
    updatedAt: daysAgoIso(18),
  },
  {
    id: 'exp-011',
    category: 'SALARY',
    description: 'Advance salary - Priya',
    amount: 800000, // ₹8,000
    expenseDate: daysAgoStr(20),
    createdBy: adminId,
    createdAt: daysAgoIso(20),
    updatedAt: daysAgoIso(20),
  },
  {
    id: 'exp-012',
    category: 'PRODUCTS',
    description: 'Towels and capes',
    amount: 350000, // ₹3,500
    expenseDate: daysAgoStr(22),
    createdBy: adminId,
    createdAt: daysAgoIso(22),
    updatedAt: daysAgoIso(22),
  },
  {
    id: 'exp-013',
    category: 'MARKETING',
    description: 'Flyer printing',
    amount: 200000, // ₹2,000
    expenseDate: daysAgoStr(25),
    createdBy: adminId,
    createdAt: daysAgoIso(25),
    updatedAt: daysAgoIso(25),
  },
  {
    id: 'exp-014',
    category: 'OTHER',
    description: 'Tea and coffee for staff',
    amount: 60000, // ₹600
    expenseDate: daysAgoStr(28),
    createdBy: adminId,
    createdAt: daysAgoIso(28),
    updatedAt: daysAgoIso(28),
  },
  {
    id: 'exp-015',
    category: 'PRODUCTS',
    description: 'Facial kits',
    amount: 950000, // ₹9,500
    expenseDate: daysAgoStr(29),
    createdBy: adminId,
    createdAt: daysAgoIso(29),
    updatedAt: daysAgoIso(29),
  }
];
