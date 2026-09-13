/**
 * Safe money helpers (integer paise arithmetic — avoids IEEE-754 float drift)
 */

/** Convert rupee string/number to integer paise (e.g. "200.50" → 20050) */
export function rupeesToPaise(rupees: number | string): number {
  const n = typeof rupees === 'string' ? parseFloat(rupees) : rupees;
  if (isNaN(n)) return 0;
  return Math.round(n * 100);
}

/** Convert integer paise to rupee float (e.g. 20050 → 200.5) */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/** Format paise value as "₹200.50" */
export function formatRupees(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(paise / 100);
}

/** Format paise value as compact "₹200" (drop .00) */
export function formatRupeesCompact(paise: number): string {
  const rupees = paise / 100;
  if (Number.isInteger(rupees)) {
    return `₹${rupees.toLocaleString('en-IN')}`;
  }
  return `₹${rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Generate a short UUID-like ID */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
