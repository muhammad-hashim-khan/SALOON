import { supabase, supabaseAdmin } from '../config/supabase';
import { logger } from '../utils/logger';

export class SupabaseService {
  /**
   * Check connection to Supabase database
   */
  public static async checkConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      if (error) {
        // Table might be empty or permissions might apply; if response returned from server without network error, Supabase is accessible
        logger.warn('Supabase ping notice:', error.message);
        return { connected: true };
      }
      return { connected: true };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown database error';
      logger.error('Failed to connect to Supabase:', errorMessage);
      return { connected: false, error: errorMessage };
    }
  }

  /**
   * Log an audit action to audit_logs table
   */
  public static async logAudit(params: {
    userId: string;
    action: string;
    entityType: string;
    entityId?: string | null;
    description: string;
  }): Promise<void> {
    try {
      const { error } = await supabaseAdmin.from('audit_logs').insert({
        user_id: params.userId,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId || null,
        description: params.description,
      });

      if (error) {
        logger.error('Failed to record audit log:', error.message);
      }
    } catch (err) {
      logger.error('Error recording audit log:', err);
    }
  }
}
