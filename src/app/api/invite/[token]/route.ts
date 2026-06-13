import { NextRequest, NextResponse } from 'next/server';
import { eq, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db, events, guests } from '@/lib/db';
import { RSVPSchema } from '@/lib/validators/guest.schema';

function err(msg: string, status: number) {
  return NextResponse.json({ error: msg }, { status });
}

type RouteContext = { params: Promise<{ token: string }> };

// ─── GET /api/invite/[token] ──────────────────────────────────────────────────
// Public – no auth required. Returns event details + optional guest prefill.

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { token } = await params;

  // 1. Check if token belongs to a specific guest (personalised invite)
  const [guestRow] = await db
    .select({
      id:           guests.id,
      fullName:     guests.fullName,
      email:        guests.email,
      rsvpStatus:   guests.rsvpStatus,
      mealPreference: guests.mealPreference,
      plusOne:      guests.plusOne,
      plusOneName:  guests.plusOneName,
      eventId:      guests.eventId,
    })
    .from(guests)
    .where(eq(guests.inviteToken, token))
    .limit(1);

  let eventId: string;
  let prefillGuest: typeof guestRow | null = null;

  if (guestRow) {
    eventId      = guestRow.eventId;
    prefillGuest = guestRow;
  } else {
    // 2. Fall back: token might be the event-level invite token
    const [event] = await db
      .select({ id: events.id })
      .from(events)
      .where(eq(events.inviteToken, token))
      .limit(1);

    if (!event) return err('Invalid or expired invite link', 404);
    eventId = event.id;
  }

  // Fetch full event details (public-safe fields only)
  const [event] = await db
    .select({
      id:           events.id,
      title:        events.title,
      eventType:    events.eventType,
      status:       events.status,
      eventDate:    events.eventDate,
      eventTime:    events.eventTime,
      endDate:      events.endDate,
      venueName:    events.venueName,
      venueAddress: events.venueAddress,
      venueCity:    events.venueCity,
      venueState:   events.venueState,
      coverImageUrl:events.coverImageUrl,
      theme:        events.theme,
      dresscode:    events.dresscode,
      specialInstructions: events.specialInstructions,
      isPrivate:    events.isPrivate,
    })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event) return err('Event not found', 404);
  if (event.status === 'cancelled') return err('This event has been cancelled', 410);

  return NextResponse.json({
    event,
    guest:       prefillGuest,
    isPersonalised: !!guestRow,
  });
}

// ─── POST /api/invite/[token] — RSVP submission ───────────────────────────────
// Public – no auth required.

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { token } = await params;

  let body: unknown;
  try { body = await request.json(); } catch { return err('Invalid JSON', 400); }

  const parsed = RSVPSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 422 });
  }

  const data = parsed.data;

  // Resolve token to guest or event
  const [guestRow] = await db
    .select({ id: guests.id, eventId: guests.eventId, fullName: guests.fullName })
    .from(guests)
    .where(eq(guests.inviteToken, token))
    .limit(1);

  if (guestRow) {
    // Personalised invite → update existing guest
    await db
      .update(guests)
      .set({
        rsvpStatus:         data.rsvpStatus as typeof guests.rsvpStatus._.data,
        plusOne:            data.plusOne,
        plusOneName:        data.plusOneName,
        mealPreference:     data.mealPreference as typeof guests.mealPreference._.data,
        dietaryRestrictions:data.dietaryRestrictions,
        consentGiven:       data.consentGiven,
        rsvpRespondedAt:    new Date(),
        updatedAt:          new Date(),
      })
      .where(eq(guests.id, guestRow.id));

    const [event] = await db
      .select({ id: events.id, title: events.title, eventDate: events.eventDate })
      .from(events)
      .where(eq(events.id, guestRow.eventId))
      .limit(1);

    return NextResponse.json({
      success:    true,
      rsvpStatus: data.rsvpStatus,
      guestName:  data.fullName ?? guestRow.fullName,
      event:      event ?? null,
    });
  }

  // General event invite token → check event exists
  const [event] = await db
    .select({ id: events.id, title: events.title, eventDate: events.eventDate })
    .from(events)
    .where(eq(events.inviteToken, token))
    .limit(1);

  if (!event) return err('Invalid invite link', 404);

  if (!data.fullName) {
    return NextResponse.json({ error: 'Name is required for new RSVP' }, { status: 422 });
  }

  // Create a new guest record
  const [newGuest] = await db.insert(guests).values({
    eventId:            event.id,
    fullName:           data.fullName,
    rsvpStatus:         data.rsvpStatus as typeof guests.rsvpStatus._.data,
    plusOne:            data.plusOne,
    plusOneName:        data.plusOneName,
    mealPreference:     data.mealPreference as typeof guests.mealPreference._.data,
    dietaryRestrictions:data.dietaryRestrictions,
    consentGiven:       data.consentGiven,
    rsvpRespondedAt:    new Date(),
    inviteToken:        nanoid(32),
    metadata:           {},
  }).returning({ id: guests.id });

  return NextResponse.json({
    success:    true,
    rsvpStatus: data.rsvpStatus,
    guestName:  data.fullName,
    guestId:    newGuest.id,
    event,
  });
}
