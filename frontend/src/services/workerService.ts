/**
 * Worker Service (DEVELOPMENT ONLY — Mock localStorage Layer)
 *
 * Abstracted worker management API.
 * Architecture:
 *   Admin UI → workerService → Mock localStorage  (Phase 4)
 *              workerService → Express API → Supabase  (Future)
 */

import { seedMockUsers, WORKERS_STORAGE_KEY } from '../mock/mockUsers';

export type WorkerRole = 'WORKER';

export interface WorkerRecord {
  id: string;
  email: string;
  password: string; // stored only in dev mock; never exposed to UI
  fullName: string;
  role: 'ADMIN' | 'WORKER';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface CreateWorkerInput {
  fullName: string;
  email: string;
  password: string;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function loadDynamicWorkers(): WorkerRecord[] {
  try {
    const raw = localStorage.getItem(WORKERS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WorkerRecord[]) : [];
  } catch {
    return [];
  }
}

function saveDynamicWorkers(workers: WorkerRecord[]): void {
  localStorage.setItem(WORKERS_STORAGE_KEY, JSON.stringify(workers));
}

function generateWorkerId(): string {
  return `worker-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const workerService = {
  /**
   * All users visible to Admin (seed + dynamically created).
   * Merges seed workers with localStorage workers.
   * Dynamic workers override seed workers if same id found (shouldn't happen, but safe).
   */
  getAllUsers(): WorkerRecord[] {
    const dynamic = loadDynamicWorkers();
    const dynamicIds = new Set(dynamic.map((w) => w.id));
    const seed = seedMockUsers.filter((u) => !dynamicIds.has(u.id));
    return [...seed, ...dynamic];
  },

  /** Only WORKER-role accounts */
  getWorkers(): WorkerRecord[] {
    return this.getAllUsers().filter((u) => u.role === 'WORKER');
  },

  /** Find any user (admin or worker) by id */
  getById(id: string): WorkerRecord | null {
    return this.getAllUsers().find((u) => u.id === id) || null;
  },

  /** Find any user by email (case-insensitive) */
  getByEmail(email: string): WorkerRecord | null {
    const e = email.trim().toLowerCase();
    return this.getAllUsers().find((u) => u.email.toLowerCase() === e) || null;
  },

  /**
   * Create a new WORKER account.
   * Returns { success, worker?, error? }
   */
  createWorker(
    input: CreateWorkerInput
  ): { success: boolean; worker?: WorkerRecord; error?: string } {
    const email = input.email.trim().toLowerCase();

    if (!input.fullName.trim()) {
      return { success: false, error: 'Full name is required.' };
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: 'Enter a valid email address.' };
    }
    if (!input.password || input.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    // Duplicate check across seed + dynamic
    if (this.getByEmail(email)) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const worker: WorkerRecord = {
      id: generateWorkerId(),
      email,
      password: input.password,
      fullName: input.fullName.trim(),
      role: 'WORKER',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    const dynamic = loadDynamicWorkers();
    saveDynamicWorkers([...dynamic, worker]);
    return { success: true, worker };
  },

  /**
   * Activate or deactivate a worker.
   * Seed workers' status changes are persisted in dynamic storage.
   */
  updateStatus(
    workerId: string,
    status: 'ACTIVE' | 'INACTIVE'
  ): { success: boolean; error?: string } {
    const dynamic = loadDynamicWorkers();

    // Check if it's a dynamic worker
    const dynIdx = dynamic.findIndex((w) => w.id === workerId);
    if (dynIdx !== -1) {
      dynamic[dynIdx] = { ...dynamic[dynIdx], status };
      saveDynamicWorkers(dynamic);
      return { success: true };
    }

    // Seed worker — persist override in dynamic store
    const seed = seedMockUsers.find((u) => u.id === workerId);
    if (!seed) {
      return { success: false, error: 'Worker not found.' };
    }

    // Cannot deactivate the only admin
    if (seed.role === 'ADMIN') {
      return { success: false, error: 'Cannot change Admin account status.' };
    }

    const override: WorkerRecord = { ...seed, status };
    saveDynamicWorkers([...dynamic, override]);
    return { success: true };
  },

  /**
   * Used by authService to look up a user for login.
   * Returns the live (potentially overridden) record.
   */
  getUserForAuth(email: string): WorkerRecord | null {
    return this.getByEmail(email);
  },
};
