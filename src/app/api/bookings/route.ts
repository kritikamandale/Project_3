import { type NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod/v4';
import { db, bookings, vendors, events, notifications } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';

async function getAuthUser() {
  const jar = await cookies();
  const token = jar.get('milap_session')?.value;
  if (!token) return null;
  try { return await verifyAccessToken(token); } catch { return null; }
}

const CreateBookingSchema = z.object({
  vendorId:           z.string().uuid(),
  eventId:            z.string().uuid(),
  serviceDate:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  serviceDescription: z.string().max(2000).optional(),
  notes:              z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'host' && user.role !== 'super_admin') {
    return Response.json({ error: 'Only hosts can create bookings' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = CreateBookingSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 422 });
  }
  const { vendorId, eventId, serviceDate, serviceDescription, notes } = parsed.data;

  // Verify ownership
  const [event] = await db
    .select({ hostId: events.hostId })
    .from(events)
    .where(eq(events.id, eventId));

  if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });
  if (event.hostId !== user.sub) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [vendor] = await db
    .select({ id: vendors.id, userId: vendors.userId, businessName: vendors.businessName })
    .from(vendors)
    .where(eq(vendors.id, vendorId));

  if (!vendor) return Response.json({ error: 'Vendor not found' }, { status: 404 });

  const [booking] = await db
    .insert(bookings)
    .values({
      eventId,
      vendorId,
      hostId: user.sub,
      status: 'inquiry',
      serviceDate,
      serviceDescription,
      notes,
    })
    .returning();

  // Notify vendor
  await db.insert(notifications).values({
    userId:    vendor.userId,
    type:      'booking',
    title:     'New Booking Inquiry',
    body:      `You have a new inquiry for ${serviceDate}. Please review and respond with a quote.`,
    actionUrl: `/vendor/bookings/${booking.id}`,
    data:      { bookingId: booking.id, eventId },
  });

  return Response.json({ booking }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status') ?? undefined;
  const eventId = searchParams.get('eventId') ?? undefined;

  const conditions = [];
  if (user.role === 'host')   conditions.push(eq(bookings.hostId, user.sub));
  if (user.role === 'vendor') {
    const [v] = await db.select({ id: vendors.id }).from(vendors).where(eq(vendors.userId, user.sub));
    if (v) conditions.push(eq(bookings.vendorId, v.id));
  }
  if (status)  conditions.push(eq(bookings.status, status as never));
  if (eventId) conditions.push(eq(bookings.eventId, eventId));

  const { and: andFn, desc: descFn } = await import('drizzle-orm');
  const rows = await db
    .select()
    .from(bookings)
    .where(conditions.length ? andFn(...conditions) : undefined)
    .orderBy(descFn(bookings.createdAt));

  return Response.json({ bookings: rows });
}
