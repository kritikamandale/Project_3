import { NextRequest, NextResponse } from 'next/server';
import { eq, and, isNull, ne } from 'drizzle-orm';
import { db, events, guests, bookings, auditLogs } from '@/lib/db';
import { hasPermission } from '@/lib/auth/permissions';
import { EventUpdateSchema } from '@/lib/validators/event.schema';
import { assertTransition, type EventStatus } from '@/lib/events/stateMachine';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRequestUser(req: NextRequest) {
  const id    = req.headers.get('x-user-id');
  const role  = req.headers.get('x-user-role');
  const email = req.headers.get('x-user-email') ?? '';
  if (!id || !role) return null;
  return { id, role, email };
}

function err(msg: string, status: number) {
  return NextResponse.json({ error: msg }, { status });
}

async function writeAudit(params: {
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  oldData?: unknown;
  newData?: unknown;
  success: boolean;
  errorMessage?: string;
  ipAddress?: string;
}) {
  try {
    await db.insert(auditLogs).values({
      userId:       params.userId,
      action:       params.action,
      resourceType: params.resourceType,
      resourceId:   params.resourceId,
      oldData:      params.oldData as Record<string, unknown>,
      newData:      params.newData as Record<string, unknown>,
      success:      params.success,
      errorMessage: params.errorMessage,
      ipAddress:    params.ipAddress,
      metadata:     {},
    });
  } catch {
    // audit failures must never break the request
  }
}

type RouteContext = { params: Promise<{ eventId: string }> };

// ─── GET /api/events/[eventId] ────────────────────────────────────────────────

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { eventId } = await params;
  const user = getRequestUser(request);
  if (!user) return err('Unauthorized', 401);

  const [event] = await db.select()
    .from(events)
    .where(and(eq(events.id, eventId), isNull(events.deletedAt)))
    .limit(1);

  if (!event) return err('Event not found', 404);

  const isSuperAdmin = user.role === 'super_admin';
  if (!isSuperAdmin && event.hostId !== user.id) return err('Forbidden', 403);

  // Guest stats aggregated from the guests table
  const guestRows = await db.select({ rsvpStatus: guests.rsvpStatus })
    .from(guests)
    .where(eq(guests.eventId, eventId));

  const stats = guestRows.reduce(
    (acc, g) => {
      acc.total++;
      if (g.rsvpStatus === 'confirmed' || g.rsvpStatus === 'checked_in') acc.confirmed++;
      else if (g.rsvpStatus === 'declined') acc.declined++;
      else if (g.rsvpStatus === 'maybe') acc.maybe++;
      else acc.pending++;
      return acc;
    },
    { total: 0, confirmed: 0, pending: 0, declined: 0, maybe: 0 },
  );

  // Upcoming 3 tasks from checklist (not completed, soonest due date first)
  const checklist = (event.checklist as Record<string, unknown>[]) ?? [];
  const upcomingTasks = checklist
    .filter((t) => !t.completed)
    .sort((a, b) => {
      const da = new Date((a.dueDate as string) ?? '9999').getTime();
      const db2 = new Date((b.dueDate as string) ?? '9999').getTime();
      return da - db2;
    })
    .slice(0, 3);

  return NextResponse.json({ event, stats, upcomingTasks });
}

// ─── PATCH /api/events/[eventId] ──────────────────────────────────────────────

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { eventId } = await params;
  const user = getRequestUser(request);
  if (!user) return err('Unauthorized', 401);
  if (!hasPermission(user.role, 'event:update:own')) return err('Forbidden', 403);

  const [existing] = await db.select()
    .from(events)
    .where(and(eq(events.id, eventId), isNull(events.deletedAt)))
    .limit(1);

  if (!existing) return err('Event not found', 404);
  if (user.role !== 'super_admin' && existing.hostId !== user.id) return err('Forbidden', 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err('Invalid JSON body', 400);
  }

  const parsed = EventUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 422 });
  }

  const data = parsed.data;

  // Validate status transition if status is being changed
  if (data.status && data.status !== existing.status) {
    try {
      assertTransition(existing.status as EventStatus, data.status as EventStatus);
    } catch (e: unknown) {
      return err(e instanceof Error ? e.message : 'Invalid status transition', 400);
    }
  }

  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined;

  const updatePayload: Partial<typeof events.$inferInsert> = {};
  if (data.title               != null) updatePayload.title               = data.title;
  if (data.description         != null) updatePayload.description         = data.description;
  if (data.eventDate           != null) updatePayload.eventDate           = data.eventDate;
  if (data.eventTime           != null) updatePayload.eventTime           = data.eventTime;
  if (data.endDate             != null) updatePayload.endDate             = data.endDate;
  if (data.endTime             != null) updatePayload.endTime             = data.endTime;
  if (data.venueName           != null) updatePayload.venueName           = data.venueName;
  if (data.venueAddress        != null) updatePayload.venueAddress        = data.venueAddress;
  if (data.venueCity           != null) updatePayload.venueCity           = data.venueCity;
  if (data.venueState          != null) updatePayload.venueState          = data.venueState;
  if (data.venuePincode        != null) updatePayload.venuePincode        = data.venuePincode;
  if (data.venueGoogleMapsUrl  != null) updatePayload.venueGoogleMapsUrl  = data.venueGoogleMapsUrl;
  if (data.venueLat            != null) updatePayload.venueLat            = String(data.venueLat);
  if (data.venueLng            != null) updatePayload.venueLng            = String(data.venueLng);
  if (data.expectedGuests      != null) updatePayload.expectedGuests      = data.expectedGuests;
  if (data.totalBudget         != null) updatePayload.totalBudget         = String(data.totalBudget);
  if (data.coverImageUrl       != null) updatePayload.coverImageUrl       = data.coverImageUrl;
  if (data.theme               != null) updatePayload.theme               = data.theme;
  if (data.dresscode           != null) updatePayload.dresscode           = data.dresscode;
  if (data.specialInstructions != null) updatePayload.specialInstructions = data.specialInstructions;
  if (data.isPrivate           != null) updatePayload.isPrivate           = data.isPrivate;
  if (data.status              != null) updatePayload.status              = data.status as typeof events.status._.data;
  if (data.checklist           != null) updatePayload.checklist           = data.checklist as unknown[];
  if (data.timeline            != null) updatePayload.timeline            = data.timeline  as unknown[];
  updatePayload.updatedAt = new Date();

  const [updated] = await db.update(events)
    .set(updatePayload)
    .where(eq(events.id, eventId))
    .returning();

  await writeAudit({
    userId:    user.id,
    action:    'event.update',
    resourceType: 'event',
    resourceId: eventId,
    oldData:   { status: existing.status, title: existing.title },
    newData:   { status: updated.status,  title: updated.title  },
    success:   true,
    ipAddress,
  });

  return NextResponse.json({ event: updated });
}

// ─── DELETE /api/events/[eventId] ─────────────────────────────────────────────

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { eventId } = await params;
  const user = getRequestUser(request);
  if (!user) return err('Unauthorized', 401);
  if (!hasPermission(user.role, 'event:delete:own')) return err('Forbidden', 403);

  const [existing] = await db
    .select({ id: events.id, hostId: events.hostId, status: events.status })
    .from(events)
    .where(and(eq(events.id, eventId), isNull(events.deletedAt)))
    .limit(1);

  if (!existing) return err('Event not found', 404);
  if (user.role !== 'super_admin' && existing.hostId !== user.id) return err('Forbidden', 403);

  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined;

  // Soft delete
  await db.update(events)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(events.id, eventId));

  // Cascade: cancel all non-terminal bookings for this event
  await db.update(bookings)
    .set({
      status:             'cancelled',
      cancellationReason: 'Event deleted by host',
      cancelledAt:        new Date(),
      cancelledBy:        user.id,
      updatedAt:          new Date(),
    })
    .where(
      and(
        eq(bookings.eventId, eventId),
        ne(bookings.status, 'cancelled'),
        ne(bookings.status, 'completed'),
      ),
    );

  await writeAudit({
    userId: user.id, action: 'event.delete', resourceType: 'event',
    resourceId: eventId, success: true, ipAddress,
  });

  return NextResponse.json({ success: true });
}
