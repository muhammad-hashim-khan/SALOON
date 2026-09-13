import { MockAuditLog, initialAuditLogs } from '../mock/mockAuditLogs';

const STORAGE_KEY = 'cutandstyle_mock_audit_logs';

export const auditService = {
  initialize() {
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialAuditLogs));
    }
  },

  getLogs(): MockAuditLog[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  logAction(
    userId: string, 
    userName: string, 
    action: string, 
    entityType: string, 
    entityId: string | null, 
    description: string
  ) {
    const logs = this.getLogs();
    const newLog: MockAuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId,
      userName,
      action,
      entityType,
      entityId,
      description,
      createdAt: new Date().toISOString()
    };
    
    logs.unshift(newLog); // Prepend to keep newest first
    
    // Keep max 1000 logs in mock storage
    if (logs.length > 1000) {
      logs.length = 1000;
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  },

  clearLogs() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }
};
