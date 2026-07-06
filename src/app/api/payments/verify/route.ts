import { type NextRequest } from 'next/server';
import crypto from 'crypto';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod/v4';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { db, payments, bookings, users, vendors, budgetItems, notifications } from '@/lib/db';
import { sendBookingConfirmationEmail, sendPaymentReceiptEmail } from '@/lib/resend/transactional';
import { sendPushToUser } from '@/lib/firebase/notifications';
import twilio from 'twilio';

async function getAuthUser() {
  const jar = await cookies();
  const token = jar.get('milap_session')?.value;
  if (!token) return null;
  try { return await verifyAccessToken(token); } catch { return null; }
}

const VerifySchema = z.object({
  razorpay_order_id:   z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature:  z.string(),
});

function verifySignature(orderId: string, paymentId: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET!;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

async function sendWhatsApp(to: string, message: string): Promise<void> {
  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
    const from = process.env.TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886';
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    await client.messages.create({ body: message, from, to: formattedTo });
  } catch {
    // WhatsApp is best-effort — never block payment confirmation
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = VerifySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 422 });
  }
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  // Signature check
  if (!verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return Response.json({ error: 'Invalid payment signature' }, { status: 400 });
  }

  // Fetch and validate the payment record
  const [payment] = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.razorpayOrderId, razorpay_order_id),
        eq(payments.payerId,         user.sub),
      ),
    );

  if (!payment) return Response.json({ error: 'Payment record not found' }, { status: 404 });
  if (payment.status === 'completed') {
    return Response.json({ success: true, paymentId: payment.id, alreadyCaptured: true });
  }

  // Mark payment captured
  const [updatedPayment] = await db
    .update(payments)
    .set({
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status:            'completed',
      updatedAt:         new Date(),
    })
    .where(eq(payments.id, payment.id))
    .returning();

  // Update booking: mark advance paid
  if (payment.bookingId) {
    const [booking] = await db
      .update(bookings)
      .set({ advancePaid: true, advanceAmount: payment.amount, status: 'confirmed', updatedAt: new Date() })
      .where(eq(bookings.id, payment.bookingId))
      .returning();

    // Add/update budget item for this booking
    if (booking) {
      await db
        .insert(budgetItems)
        .values({
          eventId:         booking.eventId,
          category:        'vendor',
          itemName:        `Advance Payment — Booking #${booking.id.slice(0, 8)}`,
          estimatedAmount: booking.quotedAmount ?? payment.amount,
          actualAmount:    payment.amount,
          isPaid:          true,
          paymentId:       updatedPayment.id,
          vendorId:        booking.vendorId,
          bookingId:       booking.id,
        })
        .onConflictDoNothing();

      // Load host + vendor user details for notifications
      const [host] = await db
        .select({ fullName: users.fullName, email: users.email, phone: users.phone })
        .from(users)
        .where(eq(users.id, booking.hostId));

      const [vendorRow] = await db
        .select({ userId: vendors.userId, businessName: vendors.businessName, whatsapp: vendors.whatsapp })
        .from(vendors)
        .where(eq(vendors.id, booking.vendorId));

      const [vendorUser] = vendorRow?.userId
        ? await db.select({ email: users.email, phone: users.phone }).from(users).where(eq(users.id, vendorRow.userId))
        : [null];

      const amountStr = `₹${Number(payment.amount).toLocaleString('en-IN')}`;
      const bookingRef = `#${booking.id.slice(0, 8).toUpperCase()}`;

      // In-app notifications
      const notifInserts = [
        {
          userId:    booking.hostId,
          type:      'payment' as const,
          title:     'Payment Successful',
          body:      `Your advance payment of ${amountStr} for booking ${bookingRef} was successful.`,
          actionUrl: `/host/events/${booking.eventId}/vendors`,
          data:      { bookingId: booking.id, paymentId: updatedPayment.id },
        },
      ];
      if (vendorRow?.userId) {
        notifInserts.push({
          userId:    vendorRow.userId,
          type:      'payment' as const,
          title:     'Payment Received',
          body:      `Advance payment of ${amountStr} received for booking ${bookingRef}.`,
          actionUrl: `/vendor/bookings/${booking.id}`,
          data:      { bookingId: booking.id, paymentId: updatedPayment.id },
        });
      }
      await db.insert(notifications).values(notifInserts);

      // Firebase push — fire & forget
      sendPushToUser(booking.hostId, {
        title: 'Payment Successful 🎉',
        body:  `Advance payment of ${amountStr} confirmed.`,
        data:  { bookingId: booking.id },
      }).catch(() => null);

      if (vendorRow?.userId) {
        sendPushToUser(vendorRow.userId, {
          title: 'Payment Received 💰',
          body:  `You received ${amountStr} from a booking.`,
          data:  { bookingId: booking.id },
        }).catch(() => null);
      }

      // Email (Resend) — fire & forget
      if (host?.email) {
        sendPaymentReceiptEmail({
          to:          host.email,
          guestName:   host.fullName,
          amount:      Number(payment.amount),
          bookingRef,
          vendorName:  vendorRow?.businessName ?? 'Vendor',
          paymentId:   razorpay_payment_id,
        }).catch(() => null);
      }
      if (vendorUser?.email) {
        sendBookingConfirmationEmail({
          to:          vendorUser.email,
          vendorName:  vendorRow?.businessName ?? 'Vendor',
          hostName:    host?.fullName ?? 'Host',
          bookingRef,
          serviceDate: booking.serviceDate,
          amount:      Number(payment.amount),
        }).catch(() => null);
      }

      // WhatsApp — fire & forget
      const waMsg = `✅ *Milap Payment Confirmed*\n\nBooking: ${bookingRef}\nAmount: ${amountStr}\n\nThank you for using Milap!`;
      if (host?.phone) sendWhatsApp(host.phone, waMsg).catch(() => null);
      if (vendorRow?.whatsapp) sendWhatsApp(vendorRow.whatsapp, waMsg).catch(() => null);
    }
  }

  return Response.json({ success: true, paymentId: updatedPayment.id });
}
