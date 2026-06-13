import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db, guests, events } from '@/lib/db';
import { hasPermission } from '@/lib/auth/permissions';
import { GuestUpdateSchema } from '@/lib/validators/guest.schema';

function getRequestUser(req: NextRequest) {
  const id   = req.headers.get('x-user-id');
  const role = req.headers.get('x-user-role') ?? '';
  if (!id) return null;
  return { id, role };
}

function err(msg: string, status: number) {
  return NextResponse.json({ error: msg }, { status });
}

type RouteContext = { params: Promise<{ eventId: string; guestId: string }> };

async function resolveOwnership(eventId: string, userId: string, role: string) {
  if (role === 'super_admin') return true;
  const [ev] = await db
    .select({ hostId: events.hostId })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);
  return ev?.hostId === userId;
}

// ─── GET /api/events/[eventId]/guests/[guestId] ───────────────────────────────

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { eventId, guestId } = await params;
  const user = getRequestUser(req);
  if (!user) return err('Unauthorized', 401);
  if (!hasPermission(user.role, 'guest:manage')) return err('Forbidden', 403);
  if (!await resolveOwnership(eventId, user.id, user.role)) return err('Forbidden', 403);

  const [guest] = await db
    .select()
    .from(guests)
    .where(and(eq(guests.id, guestId), eq(guests.eventId, eventId)))
    .limit(1);

  if (!guest) return err('Guest not found', 404);
  return NextResponse.json({ guest });
}

// ─── PATCH /api/events/[eventId]/guests/[guestId] ────────────────────────────

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { eventId, guestId } = await params;
  const user = getRequestUser(req);
  if (!user) return err('Unauthorized', 401);
  if (!hasPermission(user.role, 'guest:manage')) return err('Forbidden', 403);
  if (!await resolveOwnership(eventId, user.id, user.role)) return err('Forbidden', 403);

  let body: unknown;
  try { body = await req.json(); } catch { return err('Invalid JSON', 400); }

  const parsed = GuestUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 422 });
  }

  const data = parsed.data;
  const payload: Partial<typeof guests.$inferInsert> = { updatedAt: new Date() };

  if (data.fullName       !== undefined) payload.fullName        = data.fullName;
  if (data.email          !== undefined) payload.email           = data.email;
  if (data.phone          !== undefined) payload.phone           = data.phone;
  if (data.rsvpStatus     !== undefined) payload.rsvpStatus      = data.rsvpStatus as typeof guests.rsvpStatus._.data;
  if (data.mealPreference !== undefined) payload.mealPreference  = data.mealPreference as typeof guests.mealPreference._.data;
  if (data.tableNumber    !== undefined) payload.tableNumber     = data.tableNumber;
  if (data.groupName      !== undefined) payload.groupName       = data.groupName;
  if (data.isVip          !== undefined) payload.isVip           = data.isVip;
  if (data.dietaryRestrictions !== undefined) payload.dietaryRestrictions = data.dietaryRestrictions;

  const [updated] = await db
    .update(guests)
    .set(payload)
    .where(and(eq(guests.id, guestId), eq(guests.eventId, eventId)))
    .returning();

  if (!updated) return err('Guest not found', 404);
  return NextResponse.json({ guest: updated });
}

// ─── DELETE /api/events/[eventId]/guests/[guestId] ───────────────────────────

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { eventId, guestId } = await params;
  const user = getRequestUser(req);
  if (!user) return err('Unauthorized', 401);
  if (!hasPermission(user.role, 'guest:manage')) return err('Forbidden', 403);
  if (!await resolveOwnership(eventId, user.id, user.role)) return err('Forbidden', 403);

  const [deleted] = await db
    .delete(guests)
    .where(and(eq(guests.id, guestId), eq(guests.eventId, eventId)))
    .returning({ id: guests.id });

  if (!deleted) return err('Guest not found', 404);
  return NextResponse.json({ success: true });
}
