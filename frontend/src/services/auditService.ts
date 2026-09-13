import { supabase } from '../lib/supabase';
import { MockAuditLog } from '../mock/mockAuditLogs';

export const auditService = {
  initialize() {},

  async getLogs(): Promise<MockAuditLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error || !data) return [];
    
    return data.map((log: any) => ({
      id: log.id,
      userId: log.user_id,
      userName: log.user_name,
      action: log.action,
      entityType: log.entity_type,
      entityId: log.entity_id,
      description: log.description,
      createdAt: log.created_at
    }));
  },

  async logAction(
    userId: string, 
    userName: string, 
    action: string, 
    entityType: string, 
    entityId: string | null, 
    description: string
  ) {
    try {
      await supabase.from('audit_logs').insert({
        user_id: userId,
        user_name: userName,
        action,
        entity_type: entityType,
        entity_id: entityId,
        description
      });
    } catch (err) {
      console.error('Failed to log action', err);
    }
  },

  async clearLogs() {
    try {
      // In a real production app, clearing audit logs shouldn't be allowed,
      // or should be severely restricted.
      await supabase.from('audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (err) {
      console.error('Failed to clear logs', err);
    }
  }
};
