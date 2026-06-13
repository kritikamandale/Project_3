import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { db, guests, events } from '@/lib/db';
import { hasPermission } from '@/lib/auth/permissions';

function getRequestUser(req: NextRequest) {
  const id   = req.headers.get('x-user-id');
  const role = req.headers.get('x-user-role') ?? '';
  if (!id) return null;
  return { id, role };
}

function err(msg: string, status: number) {
  return NextResponse.json({ error: msg }, { status });
}

const CheckInSchema = z.object({
  checkInAt: z.string().datetime().optional(),
  undo:      z.boolean().optional(),
});

type RouteContext = { params: Promise<{ eventId: string; guestId: string }> };

// ─── POST /api/events/[eventId]/guests/[guestId]/checkin ─────────────────────
// Used by the check-in PWA (staff / host role required).

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { eventId, guestId } = await params;

  // Check-in staff may not carry full auth — accept x-user-id if present, otherwise
  // require a valid event staff token (future). For now, require auth.
  const user = getRequestUser(req);
  if (!user) return err('Unauthorized', 401);
  if (!hasPermission(user.role, 'guest:manage')) return err('Forbidden', 403);

  // Verify event ownership
  const [ev] = await db
    .select({ hostId: events.hostId })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!ev) return err('Event not found', 404);
  if (user.role !== 'super_admin' && ev.hostId !== user.id) return err('Forbidden', 403);

  let body: unknown;
  try { body = await req.json(); } catch { body = {}; }

  const parsed = CheckInSchema.safeParse(body);
  if (!parsed.success) return err('Invalid request body', 400);

  const { checkInAt, undo } = parsed.data;

  const [updated] = await db
    .update(guests)
    .set({
      checkInAt: undo ? null : (checkInAt ? new Date(checkInAt) : new Date()),
      updatedAt: new Date(),
    })
    .where(and(eq(guests.id, guestId), eq(guests.eventId, eventId)))
    .returning({ id: guests.id, fullName: guests.fullName, checkInAt: guests.checkInAt });

  if (!updated) return err('Guest not found', 404);

  return NextResponse.json({
    success:   true,
    guestId:   updated.id,
    guestName: updated.fullName,
    checkInAt: updated.checkInAt,
  });
}
