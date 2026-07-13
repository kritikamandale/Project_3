import { type NextRequest } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod/v4';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { getRazorpay } from '@/lib/razorpay/client';
import { db, payments, bookings } from '@/lib/db';

async function getAuthUser() {
  const jar = await cookies();
  const token = jar.get('milap_session')?.value;
  if (!token) return null;
  try { return await verifyAccessToken(token); } catch { return null; }
}

const CreateOrderSchema = z.object({
  bookingId:   z.string().uuid(),
  amount:      z.number().positive(),
  currency:    z.string().default('INR'),
  description: z.string().max(255).optional(),
});

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = CreateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 422 });
  }
  const { bookingId, amount, currency, description } = parsed.data;

  // Verify booking belongs to user
  const [booking] = await db
    .select({ id: bookings.id, hostId: bookings.hostId, status: bookings.status, eventId: bookings.eventId })
    .from(bookings)
    .where(eq(bookings.id, bookingId));

  if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });
  if (booking.hostId !== user.sub) return Response.json({ error: 'Forbidden' }, { status: 403 });
  if (!['confirmed', 'quoted'].includes(booking.status)) {
    return Response.json({ error: 'Booking must be confirmed or quoted to make payment' }, { status: 409 });
  }

  // Idempotency: if a pending payment already exists for this booking, return it
  const [existing] = await db
    .select({
      id:              payments.id,
      razorpayOrderId: payments.razorpayOrderId,
      amount:          payments.amount,
      status:          payments.status,
    })
    .from(payments)
    .where(
      and(
        eq(payments.bookingId, bookingId),
        eq(payments.status,    'pending'),
      ),
    );

  if (existing?.razorpayOrderId) {
    return Response.json({
      orderId:  existing.razorpayOrderId,
      amount:   Number(existing.amount) * 100,
      currency,
      key:      process.env.RAZORPAY_KEY_ID,
      paymentId:existing.id,
    });
  }

  // Create Razorpay order (amount in paise)
  const order = await getRazorpay().orders.create({
    amount:   Math.round(amount * 100),
    currency,
    receipt:  bookingId.slice(0, 40),
    notes:    { bookingId, userId: user.sub, eventId: booking.eventId ?? '' },
  });

  // Persist payment record
  const [payment] = await db
    .insert(payments)
    .values({
      bookingId,
      eventId:        booking.eventId ?? undefined,
      payerId:        user.sub,
      razorpayOrderId:order.id,
      amount:         String(amount),
      currency,
      status:         'pending',
      description,
    })
    .returning();

  return Response.json({
    orderId:   order.id,
    amount:    order.amount,
    currency:  order.currency,
    key:       process.env.RAZORPAY_KEY_ID,
    paymentId: payment.id,
  }, { status: 201 });
}
