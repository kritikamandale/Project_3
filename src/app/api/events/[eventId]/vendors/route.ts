import { NextRequest, NextResponse } from 'next/server';
import { eq, and, isNull } from 'drizzle-orm';
import { db, events, bookings, vendors } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';

type RouteContext = { params: Promise<{ eventId: string }> };

async function getAuthUser() {
  const jar = await cookies();
  const token = jar.get('milap_session')?.value;
  if (!token) return null;
  try { return await verifyAccessToken(token); } catch { return null; }
}

async function assertEventOwner(eventId: string, userId: string) {
  const [event] = await db
    .select({ id: events.id })
    .from(events)
    .where(and(eq(events.id, eventId), isNull(events.deletedAt)))
    .limit(1);
  if (!event) return null;
  // Allow the event owner or super_admin (checked by caller)
  return event;
}

// GET /api/events/:eventId/vendors — list bookings (vendors) for the event
export async function GET(
  _req: NextRequest,
  { params }: RouteContext,
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { eventId } = await params;
  const event = await assertEventOwner(eventId, user.sub);
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const rows = await db
    .select({
      booking: bookings,
      vendor: {
        id:           vendors.id,
        businessName: vendors.businessName,
        category:     vendors.category,
        city:         vendors.city,
        phone:        vendors.phone,
        averageRating:vendors.averageRating,
        isVerified:   vendors.isVerified,
      },
    })
    .from(bookings)
    .innerJoin(vendors, eq(bookings.vendorId, vendors.id))
    .where(eq(bookings.eventId, eventId));

  return NextResponse.json({ vendors: rows });
}
