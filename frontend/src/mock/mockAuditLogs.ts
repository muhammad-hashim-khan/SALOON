export interface MockAuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
  createdAt: string;
}

export const initialAuditLogs: MockAuditLog[] = [
  {
    id: 'audit-001',
    userId: 'mock-admin-001',
    userName: 'CUT&STYLE Admin',
    action: 'LOGIN',
    entityType: 'AUTH',
    entityId: null,
    description: 'Admin logged in successfully',
    createdAt: new Date().toISOString()
  }
];
