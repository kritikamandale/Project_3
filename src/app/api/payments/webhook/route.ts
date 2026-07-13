import { type NextRequest } from 'next/server';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { db, payments, bookings, users, notifications } from '@/lib/db';
import { sendPushToUser } from '@/lib/firebase/notifications';
import { cacheGet, cacheSet } from '@/lib/redis/client';

// Razorpay sends the raw body as text — must read before parsing

function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

interface RazorpayWebhookPayload {
  entity:  string;
  event:   string;
  payload: {
    payment?: {
      entity: {
        id:       string;
        order_id: string;
        amount:   number;
        status:   string;
        error_description?: string;
      };
    };
    refund?: {
      entity: {
        id:         string;
        payment_id: string;
        amount:     number;
      };
    };
    order?: {
      entity: { id: string };
    };
  };
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-razorpay-signature') ?? '';
  const rawBody   = await req.text();

  if (!verifyWebhookSignature(rawBody, signature)) {
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let payload: RazorpayWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as RazorpayWebhookPayload;
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { event } = payload;

  // Idempotency: Razorpay can replay webhooks — deduplicate by event + entity ID
  const eventEntity = payload.payload.payment?.entity.id
    ?? payload.payload.refund?.entity.id
    ?? payload.payload.order?.entity.id
    ?? 'unknown';

  const idempotencyKey = `webhook:${event}:${eventEntity}`;
  const alreadyProcessed = await cacheGet<boolean>(idempotencyKey);
  if (alreadyProcessed) {
    return Response.json({ received: true, skipped: 'already_processed' });
  }
  // Mark as processed (24h TTL — Razorpay replays within this window)
  await cacheSet(idempotencyKey, true, 86400);

  switch (event) {
    case 'payment.captured':
    case 'order.paid': {
      const entity = payload.payload.payment?.entity;
      if (!entity) break;

      await db
        .update(payments)
        .set({ status: 'completed', razorpayPaymentId: entity.id, updatedAt: new Date() })
        .where(eq(payments.razorpayOrderId, entity.order_id));
      break;
    }

    case 'payment.failed': {
      const entity = payload.payload.payment?.entity;
      if (!entity) break;

      const [updatedPayment] = await db
        .update(payments)
        .set({ status: 'failed', updatedAt: new Date() })
        .where(eq(payments.razorpayOrderId, entity.order_id))
        .returning();

      if (updatedPayment?.payerId) {
        // Notify the payer
        const [payer] = await db
          .select({ fullName: users.fullName, email: users.email })
          .from(users)
          .where(eq(users.id, updatedPayment.payerId));

        await db.insert(notifications).values({
          userId:    updatedPayment.payerId,
          type:      'payment',
          title:     'Payment Failed',
          body:      `Your payment of ₹${Number(updatedPayment.amount).toLocaleString('en-IN')} failed. ${entity.error_description ?? 'Please try again.'}`,
          actionUrl: updatedPayment.bookingId ? `/host/events/${updatedPayment.eventId}/vendors` : '/host/dashboard',
          data:      { orderId: entity.order_id },
        });

        sendPushToUser(updatedPayment.payerId, {
          title: 'Payment Failed ❌',
          body:  entity.error_description ?? 'Your payment could not be processed. Please try again.',
          data:  { orderId: entity.order_id },
        }).catch(() => null);
      }
      break;
    }

    case 'refund.created': {
      const entity = payload.payload.refund?.entity;
      if (!entity) break;

      await db
        .update(payments)
        .set({
          refundId:     entity.id,
          refundAmount: String(entity.amount / 100),
          refundedAt:   new Date(),
          status:       'refunded',
          updatedAt:    new Date(),
        })
        .where(eq(payments.razorpayPaymentId, entity.payment_id));
      break;
    }
  }

  return Response.json({ received: true });
}
