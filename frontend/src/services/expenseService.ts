import { MockExpense, ExpenseCategory } from '../types/expense';
import { seedMockExpenses, EXPENSES_STORAGE_KEY } from '../mock/mockExpenses';
import { generateId } from '../utils/money';

// ─── Internal helpers ─────────────────────────────────────────────────────────

function loadAllExpenses(): MockExpense[] {
  try {
    const raw = localStorage.getItem(EXPENSES_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as MockExpense[];
  } catch {
    return [];
  }
}

function saveAllExpenses(expenses: MockExpense[]): void {
  localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
}

function seedIfEmpty(): void {
  const existing = loadAllExpenses();
  if (existing.length === 0) {
    saveAllExpenses(seedMockExpenses);
  }
}

// Initialize on import
seedIfEmpty();

// ─── Public API ───────────────────────────────────────────────────────────────

export const expenseService = {
  getExpenses(): MockExpense[] {
    return loadAllExpenses().sort((a, b) => {
      // Sort by expense date descending, then created at descending
      if (b.expenseDate !== a.expenseDate) {
        return b.expenseDate.localeCompare(a.expenseDate);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  },

  getExpenseById(id: string): MockExpense | null {
    return loadAllExpenses().find((e) => e.id === id) || null;
  },

  createExpense(data: {
    category: ExpenseCategory;
    description: string;
    amount: number;
    expenseDate: string;
    createdBy: string;
  }): MockExpense {
    const now = new Date().toISOString();
    const newExpense: MockExpense = {
      id: generateId(),
      category: data.category,
      description: data.description.trim(),
      amount: data.amount,
      expenseDate: data.expenseDate,
      createdBy: data.createdBy,
      createdAt: now,
      updatedAt: now,
    };

    const all = loadAllExpenses();
    saveAllExpenses([newExpense, ...all]);
    return newExpense;
  },

  updateExpense(id: string, data: {
    category?: ExpenseCategory;
    description?: string;
    amount?: number;
    expenseDate?: string;
  }): { success: boolean; expense?: MockExpense; error?: string } {
    const all = loadAllExpenses();
    const idx = all.findIndex((e) => e.id === id);
    
    if (idx === -1) {
      return { success: false, error: 'Expense not found.' };
    }

    const current = all[idx];
    const updated: MockExpense = {
      ...current,
      category: data.category || current.category,
      description: data.description !== undefined ? data.description.trim() : current.description,
      amount: data.amount !== undefined ? data.amount : current.amount,
      expenseDate: data.expenseDate || current.expenseDate,
      updatedAt: new Date().toISOString(),
    };

    all[idx] = updated;
    saveAllExpenses(all);
    return { success: true, expense: updated };
  },

  deleteExpense(id: string): { success: boolean; error?: string } {
    const all = loadAllExpenses();
    const filtered = all.filter((e) => e.id !== id);
    
    if (filtered.length === all.length) {
      return { success: false, error: 'Expense not found.' };
    }
    
    saveAllExpenses(filtered);
    return { success: true };
  }
};
