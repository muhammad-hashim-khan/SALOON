import { supabase } from '../lib/supabase';
import { UserRole, UserStatus } from '../types';

export interface WorkerRecord {
  id: string;
  email: string;
  password?: string; // no longer stored locally
  fullName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface CreateWorkerInput {
  fullName: string;
  email: string;
  password: string;
}

export const workerService = {
  /** All users visible to Admin */
  async getAllUsers(): Promise<WorkerRecord[]> {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error || !data) return [];
    
    return data.map(p => ({
      id: p.id,
      email: p.email,
      fullName: p.full_name,
      role: p.role as UserRole,
      status: p.status as UserStatus,
      createdAt: p.created_at
    }));
  },

  /** Only WORKER-role accounts */
  async getWorkers(): Promise<WorkerRecord[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'WORKER')
      .order('created_at', { ascending: false });
      
    if (error || !data) return [];
    
    return data.map(p => ({
      id: p.id,
      email: p.email,
      fullName: p.full_name,
      role: p.role as UserRole,
      status: p.status as UserStatus,
      createdAt: p.created_at
    }));
  },

  /** Find any user by id */
  async getById(id: string): Promise<WorkerRecord | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error || !data) return null;
    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      role: data.role as UserRole,
      status: data.status as UserStatus,
      createdAt: data.created_at
    };
  },

  /** Find any user by email */
  async getByEmail(email: string): Promise<WorkerRecord | null> {
    const { data, error } = await supabase.from('profiles').select('*').ilike('email', email.trim()).maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      role: data.role as UserRole,
      status: data.status as UserStatus,
      createdAt: data.created_at
    };
  },

  /**
   * Create a new WORKER account using the Edge Function.
   */
  async createWorker(
    input: CreateWorkerInput
  ): Promise<{ success: boolean; worker?: WorkerRecord; error?: string }> {
    const email = input.email.trim().toLowerCase();

    if (!input.fullName.trim()) return { success: false, error: 'Full name is required.' };
    if (!email) return { success: false, error: 'Enter a valid email address.' };
    if (!input.password || input.password.length < 6) return { success: false, error: 'Password must be at least 6 characters.' };

    try {
      // Get the current session to pass the authorization header
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { success: false, error: 'Not authenticated as admin.' };

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-worker`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          email,
          password: input.password,
          full_name: input.fullName.trim()
        })
      });

      const resData = await response.json();
      
      if (!response.ok) {
        return { success: false, error: resData.error || 'Failed to create worker' };
      }

      // We can fetch the new worker profile from the DB to return it
      const newWorker = await this.getByEmail(email);
      if (!newWorker) throw new Error("Worker created but profile not found.");

      return { success: true, worker: newWorker };
    } catch (e: any) {
      return { success: false, error: e.message || 'Unknown error occurred.' };
    }
  },

  /** Activate or deactivate a worker */
  async updateStatus(
    workerId: string,
    status: UserStatus
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', workerId)
        .eq('role', 'WORKER'); // ensures we don't deactivate admins via this endpoint accidentally

      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to update status.' };
    }
  }
};
