import { supabase } from '../lib/supabase';
import { MockExpense, ExpenseCategory } from '../types/expense';

export const expenseService = {
  async getExpenses(): Promise<MockExpense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((e: any) => ({
      id: e.id,
      category: e.category as ExpenseCategory,
      description: e.description,
      amount: e.amount,
      expenseDate: e.expense_date,
      createdBy: e.created_by,
      createdAt: e.created_at,
      updatedAt: e.updated_at,
    }));
  },

  async getExpenseById(id: string): Promise<MockExpense | null> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      category: data.category as ExpenseCategory,
      description: data.description,
      amount: data.amount,
      expenseDate: data.expense_date,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async createExpense(data: {
    category: ExpenseCategory;
    description: string;
    amount: number;
    expenseDate: string;
    createdBy: string;
  }): Promise<{ success: boolean; expense?: MockExpense; error?: string }> {
    try {
      const { data: e, error } = await supabase
        .from('expenses')
        .insert({
          category: data.category,
          description: data.description.trim(),
          amount: data.amount,
          expense_date: data.expenseDate,
          created_by: data.createdBy,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        expense: {
          id: e.id,
          category: e.category as ExpenseCategory,
          description: e.description,
          amount: e.amount,
          expenseDate: e.expense_date,
          createdBy: e.created_by,
          createdAt: e.created_at,
          updatedAt: e.updated_at,
        },
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to create expense.' };
    }
  },

  async updateExpense(id: string, data: {
    category?: ExpenseCategory;
    description?: string;
    amount?: number;
    expenseDate?: string;
  }): Promise<{ success: boolean; expense?: MockExpense; error?: string }> {
    try {
      const updateData: any = {};
      if (data.category) updateData.category = data.category;
      if (data.description !== undefined) updateData.description = data.description.trim();
      if (data.amount !== undefined) updateData.amount = data.amount;
      if (data.expenseDate) updateData.expense_date = data.expenseDate;

      const { data: e, error } = await supabase
        .from('expenses')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        expense: {
          id: e.id,
          category: e.category as ExpenseCategory,
          description: e.description,
          amount: e.amount,
          expenseDate: e.expense_date,
          createdBy: e.created_by,
          createdAt: e.created_at,
          updatedAt: e.updated_at,
        },
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update expense.' };
    }
  },

  async deleteExpense(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to delete expense.' };
    }
  }
};
