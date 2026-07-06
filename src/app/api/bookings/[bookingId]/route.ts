import { type NextRequest } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod/v4';
import { db, bookings, vendors, users, notifications, budgetItems } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';

async function getAuthUser() {
  const jar = await cookies();
  const token = jar.get('milap_session')?.value;
  if (!token) return null;
  try { return await verifyAccessToken(token); } catch { return null; }
}

const QuoteSchema = z.object({
  action:       z.literal('quote'),
  quotedAmount: z.number().positive(),
  vendorNotes:  z.string().max(2000).optional(),
});

const ConfirmSchema = z.object({
  action: z.literal('confirm'),
});

const CompleteSchema = z.object({
  action: z.literal('complete'),
});

const CancelSchema = z.object({
  action:             z.literal('cancel'),
  cancellationReason: z.string().max(500).optional(),
});

const ActionSchema = z.discriminatedUnion('action', [
  QuoteSchema,
  ConfirmSchema,
  CompleteSchema,
  CancelSchema,
]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  const { bookingId } = await params;
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId));

  if (!booking) return Response.json({ error: 'Not found' }, { status: 404 });

  // Access check
  if (user.role !== 'super_admin') {
    let allowed = booking.hostId === user.sub;
    if (!allowed && user.role === 'vendor') {
      const [v] = await db.select({ id: vendors.id }).from(vendors).where(
        and(eq(vendors.userId, user.sub), eq(vendors.id, booking.vendorId)),
      );
      allowed = !!v;
    }
    if (!allowed) return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  return Response.json({ booking });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  const { bookingId } = await params;
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId));

  if (!booking) return Response.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const parsed = ActionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid action', issues: parsed.error.issues }, { status: 422 });
  }
  const action = parsed.data;

  // Vendor-only actions
  if (action.action === 'quote') {
    const [v] = await db.select({ userId: vendors.userId }).from(vendors).where(eq(vendors.id, booking.vendorId));
    if (!v || v.userId !== user.sub) return Response.json({ error: 'Forbidden' }, { status: 403 });
    if (booking.status !== 'inquiry') return Response.json({ error: 'Can only quote an inquiry' }, { status: 409 });

    const [updated] = await db
      .update(bookings)
      .set({ status: 'quoted', quotedAmount: String(action.quotedAmount), vendorNotes: action.vendorNotes, updatedAt: new Date() })
      .where(eq(bookings.id, bookingId))
      .returning();

    // Notify host
    const [host] = await db.select({ fullName: users.fullName }).from(users).where(eq(users.id, booking.hostId));
    await db.insert(notifications).values({
      userId:    booking.hostId,
      type:      'booking',
      title:     'Quote Received',
      body:      `Your booking has been quoted at ₹${action.quotedAmount}. Review and confirm to proceed.`,
      actionUrl: `/host/events/${booking.eventId}/vendors`,
      data:      { bookingId: booking.id },
    });

    return Response.json({ booking: updated });
  }

  // Host-only actions
  if (action.action === 'confirm') {
    if (booking.hostId !== user.sub) return Response.json({ error: 'Forbidden' }, { status: 403 });
    if (booking.status !== 'quoted') return Response.json({ error: 'Can only confirm a quoted booking' }, { status: 409 });

    const [updated] = await db
      .update(bookings)
      .set({ status: 'confirmed', updatedAt: new Date() })
      .where(eq(bookings.id, bookingId))
      .returning();

    // Add to budget items
    if (booking.quotedAmount) {
      await db.insert(budgetItems).values({
        eventId:         booking.eventId,
        category:        'vendor',
        itemName:        `Vendor booking #${bookingId.slice(0, 8)}`,
        estimatedAmount: booking.quotedAmount,
        vendorId:        booking.vendorId,
        bookingId:       bookingId,
      }).onConflictDoNothing();
    }

    return Response.json({ booking: updated });
  }

  if (action.action === 'complete') {
    if (booking.hostId !== user.sub && user.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (booking.status !== 'confirmed' && booking.status !== 'in_progress') {
      return Response.json({ error: 'Booking is not in a completable state' }, { status: 409 });
    }

    const [updated] = await db
      .update(bookings)
      .set({ status: 'completed', completedAt: new Date(), updatedAt: new Date() })
      .where(eq(bookings.id, bookingId))
      .returning();

    // Prompt host to leave review
    await db.insert(notifications).values({
      userId:    booking.hostId,
      type:      'booking',
      title:     'Leave a Review',
      body:      'How did your vendor do? Share your experience to help other hosts.',
      actionUrl: `/host/events/${booking.eventId}/vendors`,
      data:      { bookingId: booking.id, vendorId: booking.vendorId },
    });

    return Response.json({ booking: updated });
  }

  if (action.action === 'cancel') {
    const isHost   = booking.hostId === user.sub;
    const [v]      = await db.select({ userId: vendors.userId }).from(vendors).where(eq(vendors.id, booking.vendorId));
    const isVendor = v?.userId === user.sub;

    if (!isHost && !isVendor && user.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (['completed', 'cancelled'].includes(booking.status)) {
      return Response.json({ error: 'Cannot cancel a completed/cancelled booking' }, { status: 409 });
    }

    const [updated] = await db
      .update(bookings)
      .set({
        status:             'cancelled',
        cancellationReason: action.cancellationReason,
        cancelledAt:        new Date(),
        cancelledBy:        user.sub,
        updatedAt:          new Date(),
      })
      .where(eq(bookings.id, bookingId))
      .returning();

    return Response.json({ booking: updated });
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 });
}
