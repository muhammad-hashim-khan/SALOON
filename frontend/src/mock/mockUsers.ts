/**
 * DEVELOPMENT ONLY — Mock Users Dataset
 *
 * Static seed data. The workerService extends this with dynamically
 * created workers stored in localStorage.
 *
 * NOTE: Passwords are used strictly for local development testing.
 *       These accounts MUST be removed before production.
 */

export interface MockUser {
  id: string;
  email: string;
  password: string;
  fullName: string;
  role: 'ADMIN' | 'WORKER';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

/** Storage key for dynamic workers created via Admin UI */
export const WORKERS_STORAGE_KEY = 'cutandstyle_mock_workers';

/** Static seed users (never modified at runtime) */
export const seedMockUsers: MockUser[] = [
  {
    id: 'mock-admin-001',
    email: 'admin@cutandstyle.com',
    password: 'admin123',
    fullName: 'CUT&STYLE Admin',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'mock-worker-001',
    email: 'worker@cutandstyle.com',
    password: 'worker123',
    fullName: 'Demo Worker',
    role: 'WORKER',
    status: 'ACTIVE',
    createdAt: '2026-01-05T00:00:00.000Z',
  },
  {
    id: 'mock-worker-002',
    email: 'rahul@cutandstyle.com',
    password: 'rahul123',
    fullName: 'Rahul M',
    role: 'WORKER',
    status: 'ACTIVE',
    createdAt: '2026-02-10T00:00:00.000Z',
  },
  {
    id: 'mock-worker-003',
    email: 'arjun@cutandstyle.com',
    password: 'arjun123',
    fullName: 'Arjun K',
    role: 'WORKER',
    status: 'ACTIVE',
    createdAt: '2026-03-01T00:00:00.000Z',
  },
  {
    id: 'mock-worker-004',
    email: 'priya@cutandstyle.com',
    password: 'priya123',
    fullName: 'Priya S',
    role: 'WORKER',
    status: 'ACTIVE',
    createdAt: '2026-04-15T00:00:00.000Z',
  },
];

/** For backward-compat references in authService */
export const mockUsers = seedMockUsers;
