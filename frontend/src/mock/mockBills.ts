/**
 * DEVELOPMENT ONLY — Expanded Mock Bills Dataset
 * 30+ bills across multiple workers, dates, and payment methods
 * so dashboard charts, filters, and stats can actually be tested.
 */

import { MockBill } from '../types/billing';

export const BILL_COUNTER_KEY = 'cutandstyle_bill_counter';
export const BILLS_STORAGE_KEY = 'cutandstyle_mock_bills';

// ─── Date helpers ─────────────────────────────────────────────────────────────
function daysAgo(n: number, hour = 10, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function today(hour = 10, minute = 0): string {
  return daysAgo(0, hour, minute);
}

// ─── Worker refs ──────────────────────────────────────────────────────────────
const W1 = { id: 'mock-worker-001', name: 'Demo Worker' };
const W2 = { id: 'mock-worker-002', name: 'Rahul M' };
const W3 = { id: 'mock-worker-003', name: 'Arjun K' };
const W4 = { id: 'mock-worker-004', name: 'Priya S' };

function bill(
  seq: number,
  worker: { id: string; name: string },
  customer: string,
  phone: string,
  itemList: { desc: string; amt: number }[],
  discount: number,
  method: 'CASH' | 'UPI',
  createdAt: string
): MockBill {
  const items = itemList.map((it, i) => ({
    id: `item-${seq}-${i}`,
    description: it.desc,
    amount: it.amt,
  }));
  const subtotal = items.reduce((s, it) => s + it.amount, 0);
  const total = Math.max(0, subtotal - discount);
  return {
    id: `bill-seed-${String(seq).padStart(3, '0')}`,
    billNumber: `CS-2026-${String(seq).padStart(6, '0')}`,
    workerId: worker.id,
    workerName: worker.name,
    customerName: customer,
    customerPhone: phone,
    items,
    subtotal,
    discount,
    total,
    paymentMethod: method,
    createdAt,
  };
}

export const seedMockBills: MockBill[] = [
  // ── TODAY ──────────────────────────────────────────────────────────────────
  bill(1,  W2, 'Arun Kumar',    '9876543210', [{ desc: 'Hair Cut', amt: 20000 }, { desc: 'Beard Trim', amt: 10000 }], 0, 'CASH', today(9, 10)),
  bill(2,  W3, 'Priya R',       '9123456780', [{ desc: 'Hair Wash', amt: 15000 }, { desc: 'Blow Dry', amt: 20000 }], 5000, 'UPI', today(9, 45)),
  bill(3,  W4, 'Deepa M',       '9988776655', [{ desc: 'Facial', amt: 80000 }, { desc: 'Eyebrow Threading', amt: 5000 }], 10000, 'UPI', today(10, 20)),
  bill(4,  W1, 'Ramesh T',      '',           [{ desc: 'Hair Cut', amt: 20000 }], 0, 'CASH', today(10, 55)),
  bill(5,  W2, 'Kiran B',       '9001234567', [{ desc: 'Full Shave', amt: 8000 }, { desc: 'Head Massage', amt: 25000 }], 0, 'UPI', today(11, 30)),
  bill(6,  W3, '',              '',           [{ desc: 'Hair Cut', amt: 20000 }, { desc: 'Beard Trim', amt: 10000 }], 0, 'CASH', today(12, 5)),
  bill(7,  W4, 'Ananya S',      '9876501234', [{ desc: 'Hair Colour', amt: 150000 }, { desc: 'Blow Dry', amt: 20000 }], 20000, 'UPI', today(12, 40)),
  bill(8,  W1, 'Suresh P',      '9812345670', [{ desc: 'Hair Cut', amt: 20000 }], 0, 'UPI', today(13, 15)),
  bill(9,  W2, 'Meera K',       '',           [{ desc: 'Manicure', amt: 40000 }, { desc: 'Pedicure', amt: 50000 }], 10000, 'CASH', today(14, 0)),
  bill(10, W3, 'Vikram S',      '9345678901', [{ desc: 'Hair Cut', amt: 20000 }, { desc: 'Hair Wash', amt: 15000 }], 0, 'UPI', today(14, 30)),

  // ── YESTERDAY ──────────────────────────────────────────────────────────────
  bill(11, W2, 'Ravi N',        '9700012345', [{ desc: 'Hair Cut', amt: 20000 }, { desc: 'Beard Trim', amt: 10000 }], 0, 'CASH', daysAgo(1, 9, 0)),
  bill(12, W4, 'Lakshmi D',     '9611223344', [{ desc: 'Facial', amt: 80000 }], 0, 'UPI', daysAgo(1, 10, 15)),
  bill(13, W1, 'Dev A',         '',           [{ desc: 'Full Shave', amt: 8000 }], 0, 'CASH', daysAgo(1, 11, 20)),
  bill(14, W3, 'Sunita R',      '9500112233', [{ desc: 'Hair Colour', amt: 150000 }, { desc: 'Hair Cut', amt: 20000 }], 15000, 'UPI', daysAgo(1, 12, 0)),
  bill(15, W2, 'Harish G',      '9412345678', [{ desc: 'Head Massage', amt: 25000 }, { desc: 'Hair Wash', amt: 15000 }], 0, 'CASH', daysAgo(1, 14, 30)),
  bill(16, W4, 'Pooja V',       '9323456789', [{ desc: 'Manicure', amt: 40000 }, { desc: 'Eyebrow Threading', amt: 5000 }], 5000, 'UPI', daysAgo(1, 15, 45)),

  // ── 2-3 DAYS AGO ───────────────────────────────────────────────────────────
  bill(17, W3, 'Anil C',        '9234567890', [{ desc: 'Hair Cut', amt: 20000 }, { desc: 'Beard Trim', amt: 10000 }], 0, 'UPI', daysAgo(2, 10, 0)),
  bill(18, W2, 'Nisha M',       '',           [{ desc: 'Hair Wash', amt: 15000 }, { desc: 'Blow Dry', amt: 20000 }], 0, 'CASH', daysAgo(2, 11, 30)),
  bill(19, W1, 'Rohit S',       '9145678901', [{ desc: 'Hair Cut', amt: 20000 }], 0, 'CASH', daysAgo(3, 9, 45)),
  bill(20, W4, 'Kavita J',      '9056789012', [{ desc: 'Facial', amt: 80000 }, { desc: 'Manicure', amt: 40000 }], 20000, 'UPI', daysAgo(3, 12, 30)),

  // ── 4-6 DAYS AGO ───────────────────────────────────────────────────────────
  bill(21, W2, 'Ganesh P',      '9967890123', [{ desc: 'Hair Cut', amt: 20000 }, { desc: 'Full Shave', amt: 8000 }], 0, 'CASH', daysAgo(4, 10, 0)),
  bill(22, W3, 'Radha K',       '9878901234', [{ desc: 'Hair Colour', amt: 150000 }], 0, 'UPI', daysAgo(4, 11, 15)),
  bill(23, W1, 'Ajay T',        '',           [{ desc: 'Head Massage', amt: 25000 }, { desc: 'Hair Wash', amt: 15000 }], 0, 'UPI', daysAgo(5, 10, 30)),
  bill(24, W4, 'Saranya R',     '9789012345', [{ desc: 'Pedicure', amt: 50000 }, { desc: 'Eyebrow Threading', amt: 5000 }], 5000, 'CASH', daysAgo(5, 13, 0)),
  bill(25, W2, 'Bala M',        '9690123456', [{ desc: 'Hair Cut', amt: 20000 }, { desc: 'Beard Trim', amt: 10000 }], 0, 'CASH', daysAgo(6, 9, 0)),
  bill(26, W3, 'Uma D',         '9601234567', [{ desc: 'Facial', amt: 80000 }, { desc: 'Blow Dry', amt: 20000 }], 10000, 'UPI', daysAgo(6, 10, 30)),

  // ── 7-14 DAYS AGO ──────────────────────────────────────────────────────────
  bill(27, W4, 'Renu B',        '9512345678', [{ desc: 'Hair Colour', amt: 150000 }, { desc: 'Hair Cut', amt: 20000 }], 20000, 'UPI', daysAgo(8, 11, 0)),
  bill(28, W2, 'Manoj L',       '',           [{ desc: 'Hair Cut', amt: 20000 }], 0, 'CASH', daysAgo(10, 10, 0)),
  bill(29, W1, 'Sheela V',      '9423456789', [{ desc: 'Manicure', amt: 40000 }, { desc: 'Pedicure', amt: 50000 }], 10000, 'CASH', daysAgo(12, 14, 0)),
  bill(30, W3, 'Dinesh R',      '9334567890', [{ desc: 'Hair Cut', amt: 20000 }, { desc: 'Beard Trim', amt: 10000 }], 0, 'UPI', daysAgo(14, 10, 30)),

  // ── 15-30 DAYS AGO (current month history) ─────────────────────────────────
  bill(31, W2, 'Chitra N',      '9245678901', [{ desc: 'Facial', amt: 80000 }], 0, 'CASH', daysAgo(16, 10, 0)),
  bill(32, W4, 'Prakash K',     '9156789012', [{ desc: 'Hair Cut', amt: 20000 }, { desc: 'Full Shave', amt: 8000 }], 0, 'UPI', daysAgo(18, 11, 30)),
  bill(33, W3, 'Jayalakshmi P', '9067890123', [{ desc: 'Hair Colour', amt: 150000 }, { desc: 'Blow Dry', amt: 20000 }], 15000, 'CASH', daysAgo(20, 13, 0)),
  bill(34, W1, 'Venkat S',      '',           [{ desc: 'Head Massage', amt: 25000 }], 0, 'UPI', daysAgo(22, 9, 30)),
  bill(35, W2, 'Lalitha M',     '9978901234', [{ desc: 'Hair Cut', amt: 20000 }, { desc: 'Beard Trim', amt: 10000 }], 0, 'CASH', daysAgo(25, 10, 15)),
  bill(36, W4, 'Karthik R',     '9889012345', [{ desc: 'Manicure', amt: 40000 }, { desc: 'Eyebrow Threading', amt: 5000 }], 5000, 'UPI', daysAgo(28, 12, 0)),
];

export const SEED_BILL_COUNTER = 36;
