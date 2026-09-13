import { supabase } from '../lib/supabase';
import {
  MockBill,
  CreateBillInput,
} from '../types/billing';

export const billingService = {
  /** No-op for supabase integration */
  initialize(): void {},

  /** Create a new bill using the secure atomic RPC function */
  async createBill(input: CreateBillInput): Promise<MockBill> {
    const { data: billId, error } = await supabase.rpc('create_bill_with_items', {
      p_worker_id: input.workerId,
      p_customer_name: input.customerName.trim(),
      p_customer_phone: input.customerPhone.trim(),
      p_discount: input.discount,
      p_payment_method: input.paymentMethod,
      p_items: input.items.map(it => ({
        description: it.description.trim(),
        amount: it.amount
      }))
    });

    if (error) throw new Error(error.message);

    // Fetch the fully created bill to return
    const bill = await this.getBillById(billId);
    if (!bill) throw new Error("Bill created but could not be fetched.");
    return bill;
  },

  /** Fetch all bills (Admin only, handled by RLS) */
  async getBills(): Promise<MockBill[]> {
    const { data, error } = await supabase
      .from('bills')
      .select('*, bill_items(*), profiles(full_name)')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((b: any) => ({
      id: b.id,
      billNumber: b.bill_number,
      workerId: b.worker_id,
      workerName: b.profiles?.full_name || 'Unknown',
      customerName: b.customer_name,
      customerPhone: b.customer_phone,
      subtotal: b.subtotal,
      discount: b.discount,
      total: b.total,
      paymentMethod: b.payment_method,
      createdAt: b.created_at,
      items: b.bill_items.map((it: any) => ({
        id: it.id,
        description: it.description,
        amount: it.amount
      }))
    }));
  },

  /** Single bill by id */
  async getBillById(id: string): Promise<MockBill | null> {
    const { data, error } = await supabase
      .from('bills')
      .select('*, bill_items(*), profiles(full_name)')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      billNumber: data.bill_number,
      workerId: data.worker_id,
      workerName: data.profiles?.full_name ?? 'Unknown',
      customerName: data.customer_name ?? '',
      customerPhone: data.customer_phone ?? '',
      subtotal: data.subtotal,
      discount: data.discount,
      total: data.total,
      paymentMethod: data.payment_method,
      createdAt: data.created_at,
      items: data.bill_items.map((it: any) => ({
        id: it.id,
        description: it.description,
        amount: it.amount
      }))
    };
  },

  /** Bills belonging to a specific worker, sorted newest first */
  async getBillsByWorker(workerId: string): Promise<MockBill[]> {
    const { data, error } = await supabase
      .from('bills')
      .select('*, bill_items(*), profiles(full_name)')
      .eq('worker_id', workerId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((b: any) => ({
      id: b.id,
      billNumber: b.bill_number,
      workerId: b.worker_id,
      workerName: b.profiles?.full_name ?? 'Unknown',
      customerName: b.customer_name ?? '',
      customerPhone: b.customer_phone ?? '',
      subtotal: b.subtotal,
      discount: b.discount,
      total: b.total,
      paymentMethod: b.payment_method,
      createdAt: b.created_at,
      items: b.bill_items.map((it: any) => ({
        id: it.id,
        description: it.description,
        amount: it.amount
      }))
    }));
  },

  /** 
   * Preview what the next bill number will be.
   * Supabase uses a sequence, so we can preview it.
   */
  async peekNextBillNumber(): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('peek_next_bill_number' as any);
      if (error) return 'CS-YYYY-XXXXXX';
      return data ?? 'CS-YYYY-XXXXXX';
    } catch {
      return 'CS-YYYY-XXXXXX';
    }
  },
};
