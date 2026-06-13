'use client';

import { useState, useCallback } from 'react';
import { Loader2, CreditCard, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils/cn';

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key:          string;
  amount:       number;
  currency:     string;
  name:         string;
  description:  string;
  image?:       string;
  order_id:     string;
  prefill:      { name?: string; email?: string; contact?: string };
  notes?:       Record<string, string>;
  theme:        { color: string };
  handler:      (response: RazorpayResponse) => void;
  modal?:       { ondismiss?: () => void };
}

interface RazorpayInstance {
  open(): void;
  close(): void;
}

interface RazorpayResponse {
  razorpay_order_id:   string;
  razorpay_payment_id: string;
  razorpay_signature:  string;
}

interface PaymentButtonProps {
  bookingId:    string;
  amount:       number;
  description?: string;
  onSuccess?:   (paymentId: string) => void;
  onFailure?:   (error: string) => void;
  prefill?: {
    name?:    string;
    email?:   string;
    contact?: string;
  };
  className?:   string;
  children?:    React.ReactNode;
  disabled?:    boolean;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export function PaymentButton({
  bookingId,
  amount,
  description = 'EventNest Advance Payment',
  onSuccess,
  onFailure,
  prefill,
  className,
  children,
  disabled = false,
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePay = useCallback(async () => {
    setLoading(true);

    try {
      // Load Razorpay checkout script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error('Could not load payment gateway. Check your internet connection.');
      }

      // Create Razorpay order
      const orderRes = await fetch('/api/payments/create-order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ bookingId, amount, currency: 'INR', description }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? 'Failed to initiate payment');
      }

      const { orderId, key } = await orderRes.json() as {
        orderId: string;
        amount:  number;
        key:     string;
      };

      // Open Razorpay modal
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key,
          amount:      Math.round(amount * 100),
          currency:    'INR',
          name:        'EventNest',
          description,
          image:       '/logo.png',
          order_id:    orderId,
          prefill:     prefill ?? {},
          theme:       { color: '#C9933A' },

          handler: async (response: RazorpayResponse) => {
            try {
              const verifyRes = await fetch('/api/payments/verify', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(response),
              });

              if (!verifyRes.ok) {
                const err = await verifyRes.json().catch(() => ({})) as { error?: string };
                throw new Error(err.error ?? 'Payment verification failed');
              }

              const { paymentId } = await verifyRes.json() as { paymentId: string };
              toast.success('Payment successful! 🎉');
              onSuccess?.(paymentId);
              resolve();
            } catch (verifyErr) {
              reject(verifyErr);
            }
          },

          modal: {
            ondismiss: () => {
              setLoading(false);
              resolve();
            },
          },
        });

        rzp.open();
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      toast.error(message);
      onFailure?.(message);
    } finally {
      setLoading(false);
    }
  }, [bookingId, amount, description, prefill, onSuccess, onFailure]);

  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      onClick={handlePay}
      disabled={isDisabled}
      className={cn(
        'flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pichwai-gold-500 to-pichwai-saffron-500 px-6 py-3 font-semibold text-white shadow-md transition hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
    >
      {loading ? (
        <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
      ) : (
        <>
          <CreditCard className="h-4 w-4" />
          {children ?? `Pay ₹${amount.toLocaleString('en-IN')}`}
        </>
      )}
    </button>
  );
}

// Compact variant for tables / inline use
export function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending:   { label: 'Pending',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    processing:{ label: 'Processing',cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    completed: { label: 'Paid',      cls: 'bg-green-50 text-green-700 border-green-200' },
    failed:    { label: 'Failed',    cls: 'bg-red-50 text-red-700 border-red-200' },
    refunded:  { label: 'Refunded',  cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-gray-50 text-gray-600 border-gray-200' };
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium', cls)}>
      {status === 'failed' && <AlertCircle className="h-3 w-3" />}
      {label}
    </span>
  );
}
