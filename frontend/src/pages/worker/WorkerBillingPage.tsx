import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  CreditCard,
  Banknote,
  QrCode,
  User,
  Phone,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { billingService } from '../../services/billingService';
import { auditService } from '../../services/auditService';
import toast from 'react-hot-toast';
import { rupeesToPaise, formatRupeesCompact } from '../../utils/money';
import { PaymentMethod } from '../../types/billing';

// ─── Form item (UI layer, amounts in rupee strings) ──────────────────────────

interface FormItem {
  id: string;
  description: string;
  amountRaw: string; // what the user typed
}

function newItem(): FormItem {
  return { id: `ui-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, description: '', amountRaw: '' };
}

// ─── Validation errors ────────────────────────────────────────────────────────

interface FormErrors {
  items?: string;
  itemErrors?: Record<string, { description?: string; amount?: string }>;
  discount?: string;
  paymentMethod?: string;
  phone?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const WorkerBillingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [items, setItems] = useState<FormItem[]>([newItem()]);
  const [discountRaw, setDiscountRaw] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [nextBillNumber, setNextBillNumber] = useState('...');

  useEffect(() => {
    billingService.peekNextBillNumber().then(setNextBillNumber);
  }, []);

  // ── Money maths (all in paise) ──────────────────────────────────────────────

  const subtotalPaise = useMemo(
    () => items.reduce((sum, it) => sum + rupeesToPaise(it.amountRaw), 0),
    [items]
  );

  const discountPaise = useMemo(
    () => Math.max(0, rupeesToPaise(discountRaw)),
    [discountRaw]
  );

  const totalPaise = Math.max(0, subtotalPaise - discountPaise);

  // ── Item handlers ───────────────────────────────────────────────────────────

  const addItem = () => setItems((prev) => [...prev, newItem()]);

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((it) => it.id !== id));

  const updateItem = useCallback(
    (id: string, field: 'description' | 'amountRaw', value: string) =>
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
      ),
    []
  );

  // ── Validation ──────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const errs: FormErrors = {};

    // Phone optional, but if present must be 10 digits
    if (customerPhone && !/^\d{10}$/.test(customerPhone.trim())) {
      errs.phone = 'Enter a valid 10-digit phone number.';
    }

    // At least one item
    if (items.length === 0) {
      errs.items = 'Add at least one billing item.';
    } else {
      const itemErrors: FormErrors['itemErrors'] = {};
      items.forEach((it) => {
        const rowErr: { description?: string; amount?: string } = {};
        if (!it.description.trim()) rowErr.description = 'Required';
        const amt = rupeesToPaise(it.amountRaw);
        if (!it.amountRaw || isNaN(parseFloat(it.amountRaw))) {
          rowErr.amount = 'Required';
        } else if (amt <= 0) {
          rowErr.amount = 'Must be > 0';
        }
        if (Object.keys(rowErr).length) itemErrors[it.id] = rowErr;
      });
      if (Object.keys(itemErrors).length) {
        errs.items = 'Fix the highlighted items.';
        errs.itemErrors = itemErrors;
      }
    }

    // Discount
    if (discountRaw) {
      const disc = rupeesToPaise(discountRaw);
      if (isNaN(parseFloat(discountRaw)) || disc < 0) {
        errs.discount = 'Discount cannot be negative.';
      } else if (disc > subtotalPaise) {
        errs.discount = 'Discount cannot exceed subtotal.';
      }
    }

    // Payment method
    if (!paymentMethod) {
      errs.paymentMethod = 'Select a payment method.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!validate()) return;
    if (!user || !paymentMethod) return;

    setSubmitting(true);
    try {
      const bill = await billingService.createBill({
        workerId: user.id,
        workerName: user.fullName,
        customerName,
        customerPhone,
        items: items.map((it) => ({
          description: it.description,
          amount: rupeesToPaise(it.amountRaw),
        })),
        discount: discountPaise,
        paymentMethod,
      });

      auditService.logAction(
        user.id,
        user.fullName,
        'CREATE_BILL',
        'BILL',
        bill.id,
        `Created bill ${bill.billNumber} for ${formatRupeesCompact(bill.total)}`
      );
      toast.success('Bill created successfully.');

      navigate(`/worker/bills/${bill.id}`);
    } catch {
      toast.error('Unable to create bill. Please try again.');
      setErrors({ items: 'Failed to save bill. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const hasItemErr = (id: string, field: 'description' | 'amount') =>
    !!(errors.itemErrors?.[id]?.[field]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Page Header */}
      <div className="pb-2 border-b border-white/10">
        <h1 className="text-2xl font-bold text-white tracking-tight">New Bill</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Next bill: <span className="font-mono text-[#c5a880]">{nextBillNumber}</span>
        </p>
      </div>

      {/* ── Customer Information ─────────────────────────────────────── */}
      <section className="bg-[#15171e] border border-white/10 rounded-2xl p-6 space-y-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Customer Information <span className="text-gray-500 normal-case font-normal">(optional)</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-300 mb-1.5">Customer Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Arun Kumar"
                className="w-full bg-[#1b1d26] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-300 mb-1.5">Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile"
                className={`w-full bg-[#1b1d26] border rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all ${
                  errors.phone
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-white/10 focus:border-[#c5a880] focus:ring-[#c5a880]'
                }`}
              />
            </div>
            {errors.phone && (
              <p className="text-xs text-red-400 mt-1">{errors.phone}</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Bill Items ───────────────────────────────────────────────── */}
      <section className="bg-[#15171e] border border-white/10 rounded-2xl p-6 space-y-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Bill Items
        </h2>

        {/* Column Headers */}
        <div className="grid grid-cols-[1fr_130px_40px] gap-3 px-1">
          <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Description</span>
          <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Amount (₹)</span>
          <span />
        </div>

        {/* Item Rows */}
        <div className="space-y-2.5">
          {items.map((it, idx) => (
            <div key={it.id} className="grid grid-cols-[1fr_130px_40px] gap-3 items-start">
              {/* Description */}
              <div>
                <input
                  type="text"
                  value={it.description}
                  onChange={(e) => updateItem(it.id, 'description', e.target.value)}
                  placeholder={`Item ${idx + 1} (e.g. Hair Cut)`}
                  className={`w-full bg-[#1b1d26] border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all ${
                    hasItemErr(it.id, 'description')
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-white/10 focus:border-[#c5a880] focus:ring-[#c5a880]'
                  }`}
                />
                {hasItemErr(it.id, 'description') && (
                  <p className="text-[11px] text-red-400 mt-0.5 pl-1">{errors.itemErrors![it.id].description}</p>
                )}
              </div>

              {/* Amount */}
              <div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm text-gray-400 select-none">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={it.amountRaw}
                    onChange={(e) => updateItem(it.id, 'amountRaw', e.target.value)}
                    placeholder="0"
                    className={`w-full bg-[#1b1d26] border rounded-xl pl-7 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all text-right ${
                      hasItemErr(it.id, 'amount')
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : 'border-white/10 focus:border-[#c5a880] focus:ring-[#c5a880]'
                    }`}
                  />
                </div>
                {hasItemErr(it.id, 'amount') && (
                  <p className="text-[11px] text-red-400 mt-0.5 text-right pr-1">{errors.itemErrors![it.id].amount}</p>
                )}
              </div>

              {/* Remove */}
              <button
                type="button"
                onClick={() => removeItem(it.id)}
                disabled={items.length === 1}
                title="Remove item"
                className="mt-1 p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-white/5 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {errors.items && !errors.itemErrors && (
          <div className="flex items-center gap-2 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errors.items}
          </div>
        )}
        {errors.items && errors.itemErrors && (
          <p className="text-xs text-red-400">{errors.items}</p>
        )}

        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </section>

      {/* ── Discount & Summary ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Discount */}
        <section className="bg-[#15171e] border border-white/10 rounded-2xl p-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Discount <span className="normal-case font-normal">(optional)</span>
          </h2>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-sm text-gray-400">₹</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={discountRaw}
              onChange={(e) => setDiscountRaw(e.target.value)}
              placeholder="0"
              className={`w-full bg-[#1b1d26] border rounded-xl pl-7 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all ${
                errors.discount
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-white/10 focus:border-[#c5a880] focus:ring-[#c5a880]'
              }`}
            />
          </div>
          {errors.discount && (
            <p className="text-xs text-red-400 mt-1.5">{errors.discount}</p>
          )}
        </section>

        {/* Live Summary */}
        <section className="bg-[#1b1d26] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal</span>
              <span className="font-mono text-white">{formatRupeesCompact(subtotalPaise)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Discount</span>
              <span className="font-mono text-red-400">
                {discountPaise > 0 ? `− ${formatRupeesCompact(discountPaise)}` : '−'}
              </span>
            </div>
            <div className="border-t border-white/10 pt-2 mt-2 flex justify-between font-bold text-base">
              <span className="text-white">Total</span>
              <span className="text-[#c5a880] font-mono text-lg">{formatRupeesCompact(totalPaise)}</span>
            </div>
          </div>
        </section>
      </div>

      {/* ── Payment Method ───────────────────────────────────────────── */}
      <section className="bg-[#15171e] border border-white/10 rounded-2xl p-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Payment Method <span className="text-red-400">*</span>
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {/* CASH */}
          <button
            type="button"
            onClick={() => setPaymentMethod('CASH')}
            className={`flex flex-col items-center justify-center gap-2.5 py-5 rounded-2xl border-2 transition-all ${
              paymentMethod === 'CASH'
                ? 'border-emerald-400 bg-emerald-950/40 shadow-lg shadow-emerald-400/10'
                : 'border-white/10 bg-[#1b1d26] hover:border-emerald-400/40 hover:bg-emerald-950/20'
            }`}
          >
            <Banknote className={`w-8 h-8 ${paymentMethod === 'CASH' ? 'text-emerald-400' : 'text-gray-400'}`} />
            <span className={`text-sm font-bold tracking-widest uppercase ${paymentMethod === 'CASH' ? 'text-emerald-300' : 'text-gray-300'}`}>
              Cash
            </span>
            {paymentMethod === 'CASH' && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          {/* UPI */}
          <button
            type="button"
            onClick={() => setPaymentMethod('UPI')}
            className={`flex flex-col items-center justify-center gap-2.5 py-5 rounded-2xl border-2 transition-all ${
              paymentMethod === 'UPI'
                ? 'border-blue-400 bg-blue-950/40 shadow-lg shadow-blue-400/10'
                : 'border-white/10 bg-[#1b1d26] hover:border-blue-400/40 hover:bg-blue-950/20'
            }`}
          >
            <QrCode className={`w-8 h-8 ${paymentMethod === 'UPI' ? 'text-blue-400' : 'text-gray-400'}`} />
            <span className={`text-sm font-bold tracking-widest uppercase ${paymentMethod === 'UPI' ? 'text-blue-300' : 'text-gray-300'}`}>
              UPI
            </span>
            {paymentMethod === 'UPI' && (
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
            )}
          </button>
        </div>
        {errors.paymentMethod && (
          <p className="text-xs text-red-400 mt-3 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.paymentMethod}
          </p>
        )}
      </section>

      {/* ── Generate Bill Button ──────────────────────────────────────── */}
      <div className="pb-6">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={submitting}
          className="w-full py-4 rounded-2xl bg-[#c5a880] hover:bg-[#d6be9a] text-black font-bold text-base tracking-wide transition-all shadow-xl shadow-[#c5a880]/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Generate Bill
            </>
          )}
        </button>
      </div>
    </div>
  );
};
