import Razorpay from 'razorpay';

const globalForRazorpay = globalThis as unknown as { razorpay: Razorpay | undefined };

/**
 * Lazily initialise the Razorpay client so the module can be imported at
 * build-time (when env vars may not yet be available) without crashing.
 */
export function getRazorpay(): Razorpay {
  if (globalForRazorpay.razorpay) return globalForRazorpay.razorpay;

  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set.');
  }

  const client = new Razorpay({ key_id, key_secret });

  if (process.env.NODE_ENV !== 'production') {
    globalForRazorpay.razorpay = client;
  }

  return client;
}
