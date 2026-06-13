import { NextRequest, NextResponse } from 'next/server';
import { eq, and, ilike, or, count } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db, events, guests, auditLogs } from '@/lib/db';
import { hasPermission } from '@/lib/auth/permissions';
import {
  GuestCreateSchema,
  GuestListQuerySchema,
} from '@/lib/validators/guest.schema';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRequestUser(req: NextRequest) {
  const id   = req.headers.get('x-user-id');
  const role = req.headers.get('x-user-role') ?? '';
  if (!id) return null;
  return { id, role };
}

function err(msg: string, status: number) {
  return NextResponse.json({ error: msg }, { status });
}

async function assertEventOwner(eventId: string, userId: string, role: string) {
  const [event] = await db
    .select({ id: events.id, hostId: events.hostId })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event) return null;
  if (role !== 'super_admin' && event.hostId !== userId) return null;
  return event;
}

type RouteContext = { params: Promise<{ eventId: string }> };

// ─── GET /api/events/[eventId]/guests ─────────────────────────────────────────

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { eventId } = await params;
  const user = getRequestUser(request);
  if (!user) return err('Unauthorized', 401);
  if (!hasPermission(user.role, 'guest:manage')) return err('Forbidden', 403);

  const event = await assertEventOwner(eventId, user.id, user.role);
  if (!event) return err('Event not found or access denied', 404);

  const { searchParams } = new URL(request.url);
  const parsed = GuestListQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return err('Invalid query', 400);

  const { page, limit, rsvpStatus, groupName, search } = parsed.data;
  const offset = (page - 1) * limit;

  const filters = [
    eq(guests.eventId, eventId),
    ...(rsvpStatus ? [eq(guests.rsvpStatus, rsvpStatus as typeof guests.rsvpStatus._.data)] : []),
    ...(groupName   ? [eq(guests.groupName, groupName)]   : []),
    ...(search      ? [or(
      ilike(guests.fullName, `%${search}%`),
      ilike(guests.email,    `%${search}%`),
      ilike(guests.phone,    `%${search}%`),
    )] : []),
  ];

  const [rows, [{ total }]] = await Promise.all([
    db.select().from(guests).where(and(...filters)).limit(limit).offset(offset),
    db.select({ total: count() }).from(guests).where(and(...filters)),
  ]);

  return NextResponse.json({
    guests: rows,
    pagination: { page, limit, total: Number(total), totalPages: Math.ceil(Number(total) / limit) },
  });
}

// ─── POST /api/events/[eventId]/guests ────────────────────────────────────────

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { eventId } = await params;
  const user = getRequestUser(request);
  if (!user) return err('Unauthorized', 401);
  if (!hasPermission(user.role, 'guest:manage')) return err('Forbidden', 403);

  const event = await assertEventOwner(eventId, user.id, user.role);
  if (!event) return err('Event not found or access denied', 404);

  let body: unknown;
  try { body = await request.json(); } catch { return err('Invalid JSON', 400); }

  const parsed = GuestCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 422 });
  }

  const data = parsed.data;
  const inviteToken = nanoid(32);

  const [guest] = await db.insert(guests).values({
    eventId,
    fullName:            data.fullName,
    email:               data.email,
    phone:               data.phone,
    plusOne:             data.plusOne,
    plusOneName:         data.plusOneName,
    mealPreference:      data.mealPreference as typeof guests.mealPreference._.data,
    dietaryRestrictions: data.dietaryRestrictions,
    side:                data.side as typeof guests.side._.data,
    relation:            data.relation,
    groupName:           data.groupName,
    isVip:               data.isVip,
    specialNotes:        data.specialNotes,
    tableNumber:         data.tableNumber,
    seatNumber:          data.seatNumber,
    inviteToken,
    rsvpStatus:          'pending',
    consentGiven:        false,
    metadata:            {},
  }).returning();

  return NextResponse.json({ guest }, { status: 201 });
}
