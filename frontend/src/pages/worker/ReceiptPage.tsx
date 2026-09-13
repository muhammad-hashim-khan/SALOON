import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Printer,
  ArrowLeft,
  Receipt,
  Banknote,
  QrCode,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { billingService } from '../../services/billingService';
import { MockBill } from '../../types/billing';
import { formatRupeesCompact } from '../../utils/money';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export const ReceiptPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [bill, setBill] = useState<MockBill | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    if (!id) { setNotFound(true); return; }
    billingService.getBillById(id).then(found => {
      if (!found) { setNotFound(true); return; }
      // RBAC: Workers can only view their own bills
      if (user?.role === 'WORKER' && found.workerId !== user.id) {
        setForbidden(true);
        return;
      }
      setBill(found);
    });
  }, [id, user]);

  const handlePrint = () => {
    window.print();
  };

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-gray-500">
        <AlertCircle className="w-12 h-12 text-red-400 opacity-60" />
        <p className="text-xl font-semibold text-gray-300">Bill Not Found</p>
        <p className="text-sm">This bill may have been deleted or the link is invalid.</p>
        <button
          onClick={() => navigate(user?.role === 'ADMIN' ? '/admin/bills' : '/worker/bills')}
          className="mt-4 px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-all"
        >
          Back to Bills
        </button>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-gray-500">
        <AlertCircle className="w-12 h-12 text-amber-400 opacity-60" />
        <p className="text-xl font-semibold text-gray-300">Access Denied</p>
        <p className="text-sm">You do not have permission to view this bill.</p>
        <button
          onClick={() => navigate(user?.role === 'ADMIN' ? '/admin/bills' : '/worker/bills')}
          className="mt-4 px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-all"
        >
          Back to Bills
        </button>
      </div>
    );
  }

  if (!bill) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Toolbar (hidden in print) */}
      <div className="flex items-center gap-3 print:hidden">
        <button
          onClick={() => navigate(user?.role === 'ADMIN' ? '/admin/bills' : '/worker/bills')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Bills
        </button>
        <div className="flex-1" />
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#c5a880] hover:bg-[#d6be9a] text-black text-sm font-semibold transition-all shadow-lg shadow-[#c5a880]/20"
        >
          <Printer className="w-4 h-4" />
          Print Receipt
        </button>
        {user?.role !== 'ADMIN' && (
          <button
            onClick={() => navigate('/worker/billing')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-gray-300 hover:text-white transition-all"
          >
            <Receipt className="w-4 h-4" />
            New Bill
          </button>
        )}
      </div>

      {/* ────────────────── Receipt Card ────────────────────────────── */}
      <div
        ref={printRef}
        id="receipt-printable"
        className="receipt-card bg-white rounded-2xl overflow-hidden shadow-2xl shadow-black/40 print:shadow-none print:rounded-none"
      >
        {/* Header */}
        <div className="receipt-header bg-gradient-to-br from-[#1a1208] to-[#2a1f10] px-8 py-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMC0xMnY2aDZ2LTZoLTZ6bTEyIDEydjZoNnYtNmgtNnptMC0xMnY2aDZ2LTZoLTZ6TTI0IDM0djZoNnYtNmgtNnptMC0xMnY2aDZ2LTZoLTZ6bTEyIDI0djZoNnYtNmgtNnptMC0xMnY2aDZ2LTZoLTZ6TTI0IDQ2djZoNnYtNmgtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />
          <div className="relative z-10">
            <h1 className="text-3xl font-black tracking-[0.25em] text-[#c5a880] uppercase">
              CUT&amp;STYLE
            </h1>
            <p className="text-xs tracking-[0.3em] uppercase text-[#a08060] mt-1">
              Salon &amp; Spa
            </p>
            <div className="mt-4 pt-4 border-t border-white/10">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-200">PAYMENT RECEIVED</p>
            </div>
          </div>
        </div>

        {/* Receipt Body */}
        <div className="px-8 py-6 space-y-5 bg-white">
          {/* Meta info */}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">Bill Number</p>
              <p className="text-base font-bold font-mono text-gray-900 mt-0.5">{bill.billNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">Date &amp; Time</p>
              <p className="text-xs text-gray-700 mt-0.5 font-medium">{formatDate(bill.createdAt)}</p>
            </div>
          </div>

          {/* Customer */}
          {(bill.customerName || bill.customerPhone) && (
            <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
              <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-1">Customer</p>
              {bill.customerName && (
                <p className="text-sm font-semibold text-gray-900">{bill.customerName}</p>
              )}
              {bill.customerPhone && (
                <p className="text-xs text-gray-500 mt-0.5">{bill.customerPhone}</p>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="receipt-divider border-t-2 border-dashed border-gray-200" />

          {/* Items */}
          <div>
            <div className="flex justify-between text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-2.5">
              <span>Service / Item</span>
              <span>Amount</span>
            </div>
            <div className="space-y-2">
              {bill.items.map((item) => (
                <div key={item.id} className="flex justify-between items-start text-sm">
                  <span className="text-gray-800 pr-4">{item.description}</span>
                  <span className="font-mono font-semibold text-gray-900 shrink-0 tabular-nums">
                    {formatRupeesCompact(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="receipt-divider border-t-2 border-dashed border-gray-200" />

          {/* Totals */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums">{formatRupeesCompact(bill.subtotal)}</span>
            </div>
            {bill.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span className="font-mono tabular-nums">− {formatRupeesCompact(bill.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 text-gray-900">
              <span>Total</span>
              <span className="font-mono tabular-nums text-[#9a7a50]">
                {formatRupeesCompact(bill.total)}
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
            bill.paymentMethod === 'CASH'
              ? 'bg-emerald-50 border border-emerald-100'
              : 'bg-blue-50 border border-blue-100'
          }`}>
            {bill.paymentMethod === 'CASH' ? (
              <Banknote className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <QrCode className="w-5 h-5 text-blue-600 shrink-0" />
            )}
            <div>
              <p className="text-[11px] uppercase tracking-wider font-medium text-gray-500">Paid via</p>
              <p className={`text-sm font-bold uppercase tracking-widest ${
                bill.paymentMethod === 'CASH' ? 'text-emerald-700' : 'text-blue-700'
              }`}>
                {bill.paymentMethod}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="receipt-divider border-t-2 border-dashed border-gray-200" />

          {/* Footer */}
          <div className="text-center space-y-1">
            <p className="text-xs text-gray-400">Served by: <span className="font-medium text-gray-600">{bill.workerName}</span></p>
            <p className="text-sm font-semibold text-gray-700">Thank you for visiting!</p>
            <p className="text-xs text-gray-400">We hope to see you again soon 🌿</p>
          </div>
        </div>
      </div>
    </div>
  );
};
