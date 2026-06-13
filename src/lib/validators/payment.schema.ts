import { z } from 'zod';

// ─── Create Razorpay order ────────────────────────────────────────────────────

export const CreateOrderSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
  // amount and currency are ALWAYS fetched server-side — never trusted from client
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

// ─── Verify payment (client callback) ────────────────────────────────────────

export const VerifyPaymentSchema = z.object({
  razorpayOrderId:   z.string().min(1, 'Order ID is required').max(255),
  razorpayPaymentId: z.string().min(1, 'Payment ID is required').max(255),
  razorpaySignature: z.string().min(1, 'Signature is required').max(512),
});

export type VerifyPaymentInput = z.infer<typeof VerifyPaymentSchema>;

// ─── Razorpay webhook body ────────────────────────────────────────────────────

const RazorpayEntitySchema = z.object({
  id:       z.string(),
  order_id: z.string().optional(),
  amount:   z.number().optional(),
  currency: z.string().length(3).optional(),
  status:   z.string().optional(),
});

export const WebhookPayloadSchema = z.object({
  event: z.string().min(1),
  payload: z.object({
    payment: z.object({ entity: RazorpayEntitySchema }).optional(),
    order:   z.object({ entity: RazorpayEntitySchema }).optional(),
    refund:  z.object({ entity: RazorpayEntitySchema }).optional(),
  }),
  created_at: z.number().optional(),
});

export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;

// ─── Refund ───────────────────────────────────────────────────────────────────

export const RefundSchema = z.object({
  paymentId: z.string().uuid('Invalid payment ID'),
  reason:    z.string().min(5).max(500),
  amount:    z.number().positive().optional(), // partial refund — omit for full
});

export type RefundInput = z.infer<typeof RefundSchema>;
