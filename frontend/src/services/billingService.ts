/**
 * Billing Service (DEVELOPMENT ONLY — Mock localStorage Layer)
 *
 * Abstracted billing API.  When switching to a real backend, replace the
 * body of each method with an API call — the UI callers need no changes.
 *
 * Architecture:
 *   Billing UI
 *     ↓
 *   billingService.ts   ← you are here
 *     ↓
 *   Mock localStorage   (Phase 3)
 *     ↓
 *   Express API → Supabase   (Future)
 */

import {
  MockBill,
  MockBillItem,
  CreateBillInput,
} from '../types/billing';
import {
  seedMockBills,
  BILLS_STORAGE_KEY,
  BILL_COUNTER_KEY,
  SEED_BILL_COUNTER,
} from '../mock/mockBills';
import { generateId } from '../utils/money';

// ─── Internal helpers ────────────────────────────────────────────────────────

function loadAllBills(): MockBill[] {
  try {
    const raw = localStorage.getItem(BILLS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as MockBill[];
  } catch {
    return [];
  }
}

function saveAllBills(bills: MockBill[]): void {
  localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(bills));
}

function getCounter(): number {
  const raw = localStorage.getItem(BILL_COUNTER_KEY);
  return raw ? parseInt(raw, 10) : 0;
}

function incrementCounter(): number {
  const next = getCounter() + 1;
  localStorage.setItem(BILL_COUNTER_KEY, String(next));
  return next;
}

function formatBillNumber(counter: number): string {
  const year = new Date().getFullYear();
  return `CS-${year}-${String(counter).padStart(6, '0')}`;
}

// ─── Seeding ─────────────────────────────────────────────────────────────────

/**
 * Call once on app load.
 * If storage is empty, populate with seed data so the UI has sample bills.
 */
function seedIfEmpty(): void {
  const existing = loadAllBills();
  if (existing.length === 0) {
    saveAllBills(seedMockBills);
    // Only set counter if it hasn't been set yet
    if (!localStorage.getItem(BILL_COUNTER_KEY)) {
      localStorage.setItem(BILL_COUNTER_KEY, String(SEED_BILL_COUNTER));
    }
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const billingService = {
  /** Must be called once at app startup */
  initialize(): void {
    seedIfEmpty();
  },

  /** Create a new bill; returns the persisted bill */
  createBill(input: CreateBillInput): MockBill {
    const counter = incrementCounter();
    const billNumber = formatBillNumber(counter);

    const items: MockBillItem[] = input.items.map((it) => ({
      id: generateId(),
      description: it.description.trim(),
      amount: it.amount, // paise
    }));

    const subtotal = items.reduce((sum, it) => sum + it.amount, 0);
    const total = Math.max(0, subtotal - input.discount);

    const bill: MockBill = {
      id: generateId(),
      billNumber,
      workerId: input.workerId,
      workerName: input.workerName,
      customerName: input.customerName.trim(),
      customerPhone: input.customerPhone.trim(),
      items,
      subtotal,
      discount: input.discount,
      total,
      paymentMethod: input.paymentMethod,
      createdAt: new Date().toISOString(),
    };

    const all = loadAllBills();
    saveAllBills([bill, ...all]);
    return bill;
  },

  /** All bills in storage */
  getBills(): MockBill[] {
    return loadAllBills();
  },

  /** Single bill by id */
  getBillById(id: string): MockBill | null {
    return loadAllBills().find((b) => b.id === id) || null;
  },

  /** Bills belonging to a specific worker, sorted newest first */
  getBillsByWorker(workerId: string): MockBill[] {
    return loadAllBills()
      .filter((b) => b.workerId === workerId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  },

  /** Preview what the next bill number will be (without consuming it) */
  peekNextBillNumber(): string {
    return formatBillNumber(getCounter() + 1);
  },
};
