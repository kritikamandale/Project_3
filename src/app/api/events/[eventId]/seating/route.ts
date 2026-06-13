import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { db, events } from '@/lib/db';
import { hasPermission } from '@/lib/auth/permissions';

// Seating data is stored as JSON in events.metadata.seating — no separate table needed.
// Shape: { tables: SeatingTable[], seats: GuestSeat[] }

function getRequestUser(req: NextRequest) {
  const id   = req.headers.get('x-user-id');
  const role = req.headers.get('x-user-role') ?? '';
  if (!id) return null;
  return { id, role };
}

function err(msg: string, status: number) {
  return NextResponse.json({ error: msg }, { status });
}

const SeatingTableSchema = z.object({
  id:       z.string(),
  label:    z.string(),
  shape:    z.enum(['round', 'rectangular', 'cocktail']),
  capacity: z.number().int().min(1).max(100),
  x:        z.number(),
  y:        z.number(),
});

const GuestSeatSchema = z.object({
  guestId:   z.string(),
  guestName: z.string(),
  tableId:   z.string(),
});

const SeatingPayloadSchema = z.object({
  tables: z.array(SeatingTableSchema),
  seats:  z.array(GuestSeatSchema),
});

type RouteContext = { params: Promise<{ eventId: string }> };

// ─── GET /api/events/[eventId]/seating ───────────────────────────────────────

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { eventId } = await params;
  const user = getRequestUser(req);
  if (!user) return err('Unauthorized', 401);
  if (!hasPermission(user.role, 'event:read:own')) return err('Forbidden', 403);

  const [event] = await db
    .select({ hostId: events.hostId, metadata: events.metadata })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event) return err('Event not found', 404);
  if (user.role !== 'super_admin' && event.hostId !== user.id) return err('Forbidden', 403);

  const seating = (event.metadata as Record<string, unknown>)?.seating ?? { tables: [], seats: [] };
  return NextResponse.json(seating);
}

// ─── PUT /api/events/[eventId]/seating ───────────────────────────────────────

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { eventId } = await params;
  const user = getRequestUser(req);
  if (!user) return err('Unauthorized', 401);
  if (!hasPermission(user.role, 'event:update:own')) return err('Forbidden', 403);

  const [event] = await db
    .select({ hostId: events.hostId, metadata: events.metadata })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event) return err('Event not found', 404);
  if (user.role !== 'super_admin' && event.hostId !== user.id) return err('Forbidden', 403);

  let body: unknown;
  try { body = await req.json(); } catch { return err('Invalid JSON', 400); }

  const parsed = SeatingPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 422 });
  }

  const existingMeta = (event.metadata as Record<string, unknown>) ?? {};
  const updatedMeta  = { ...existingMeta, seating: parsed.data };

  await db
    .update(events)
    .set({ metadata: updatedMeta, updatedAt: new Date() })
    .where(and(eq(events.id, eventId)));

  return NextResponse.json({ success: true, tables: parsed.data.tables.length, seats: parsed.data.seats.length });
}
