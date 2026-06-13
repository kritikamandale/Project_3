import { NextRequest, NextResponse } from 'next/server';
import { eq, and, count } from 'drizzle-orm';
import { z } from 'zod/v4';
import { db, eventMemories, events, guests } from '@/lib/db';
import { thumbnailUrl } from '@/lib/cloudinary/config';

type RouteCtx = { params: Promise<{ inviteToken: string }> };

const UploadSchema = z.object({
  guestName:          z.string().min(1).max(255),
  cloudinaryPublicId: z.string().min(1).max(255),
  url:                z.string().url(),
  caption:            z.string().max(500).optional(),
  width:              z.number().int().optional(),
  height:             z.number().int().optional(),
  fileSize:           z.number().int().optional(),
  mimeType:           z.string().max(50).optional(),
});

// GET /api/guest/memories/[inviteToken] — verify token and return event info
export async function GET(_req: NextRequest, { params }: RouteCtx) {
  const { inviteToken } = await params;

  // Look up guest by invite token
  const [guest] = await db
    .select({
      guestId:  guests.id,
      fullName: guests.fullName,
      rsvpStatus: guests.rsvpStatus,
      eventId:  guests.eventId,
    })
    .from(guests)
    .where(eq(guests.inviteToken, inviteToken))
    .limit(1);

  if (!guest) {
    // Try event-level invite token
    const [ev] = await db
      .select({ id: events.id, title: events.title, hostId: events.hostId, eventType: events.eventType })
      .from(events)
      .where(eq(events.inviteToken, inviteToken))
      .limit(1);

    if (!ev) return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 });

    return NextResponse.json({
      eventId:    ev.id,
      eventTitle: ev.title,
      eventType:  ev.eventType,
      guestName:  '',
      canUpload:  true,
    });
  }

  if (guest.rsvpStatus !== 'confirmed' && guest.rsvpStatus !== 'checked_in') {
    return NextResponse.json({ error: 'Only confirmed guests can upload photos' }, { status: 403 });
  }

  const [ev] = await db
    .select({ id: events.id, title: events.title, hostId: events.hostId, eventType: events.eventType })
    .from(events)
    .where(eq(events.id, guest.eventId))
    .limit(1);

  if (!ev) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  // Count how many photos this guest already uploaded (by guestName in metadata)
  const [uploadCount] = await db
    .select({ total: count() })
    .from(eventMemories)
    .where(
      and(
        eq(eventMemories.eventId, ev.id),
        eq(eventMemories.uploadedBy, ev.hostId),
      )
    );

  return NextResponse.json({
    eventId:      ev.id,
    eventTitle:   ev.title,
    eventType:    ev.eventType,
    guestName:    guest.fullName,
    guestId:      guest.guestId,
    canUpload:    true,
    uploadedCount: uploadCount?.total ?? 0,
  });
}

// POST /api/guest/memories/[inviteToken] — save guest photo
export async function POST(req: NextRequest, { params }: RouteCtx) {
  const { inviteToken } = await params;

  // Resolve invite token to event
  const [ev] = await db
    .select({ id: events.id, hostId: events.hostId, inviteToken: events.inviteToken })
    .from(events)
    .where(eq(events.inviteToken, inviteToken))
    .limit(1);

  // Try guest-level token too
  let eventId: string;
  let hostId: string;

  if (ev) {
    eventId = ev.id;
    hostId  = ev.hostId;
  } else {
    const [guest] = await db
      .select({ eventId: guests.eventId, rsvpStatus: guests.rsvpStatus })
      .from(guests)
      .where(eq(guests.inviteToken, inviteToken))
      .limit(1);

    if (!guest) return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 });
    if (guest.rsvpStatus !== 'confirmed' && guest.rsvpStatus !== 'checked_in') {
      return NextResponse.json({ error: 'Only confirmed guests can upload' }, { status: 403 });
    }

    const [parentEv] = await db
      .select({ id: events.id, hostId: events.hostId })
      .from(events)
      .where(eq(events.id, guest.eventId))
      .limit(1);

    if (!parentEv) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    eventId = parentEv.id;
    hostId  = parentEv.hostId;
  }

  // Rate limit: 20 photos per guest (identified by guestName in metadata)
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = UploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { guestName, cloudinaryPublicId, url: photoUrl, caption, width, height, fileSize, mimeType } = parsed.data;

  const thumb = thumbnailUrl(cloudinaryPublicId);

  const [memory] = await db
    .insert(eventMemories)
    .values({
      eventId,
      uploadedBy:          hostId,
      cloudinaryPublicId,
      url:                 photoUrl,
      thumbnailUrl:        thumb,
      caption,
      width,
      height,
      fileSize,
      mimeType,
      tags:                [],
      metadata:            { uploadedByGuest: guestName, inviteToken },
    })
    .returning();

  return NextResponse.json({ memory }, { status: 201 });
}
