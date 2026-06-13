import { NextRequest, NextResponse } from 'next/server';
import { eq, and, inArray } from 'drizzle-orm';
import { db, events, guests } from '@/lib/db';
import { hasPermission } from '@/lib/auth/permissions';
import { SendInvitesSchema } from '@/lib/validators/guest.schema';
import { buildInviteEmailHtml } from '@/lib/resend/templates/InviteEmail';
import { Resend } from 'resend';
import twilio from 'twilio';

// ─── Per-event in-memory rate limiter (500 invites / hour) ────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(eventId: string, requested: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(eventId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(eventId, { count: requested, resetAt: now + 3_600_000 });
    return true;
  }
  if (entry.count + requested > 500) return false;
  entry.count += requested;
  return true;
}

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

const APP_URL    = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const resend     = new Resend(process.env.RESEND_API_KEY!);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@eventnest.in';

function twilioClient() {
  return twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
}

// ─── Channel senders ──────────────────────────────────────────────────────────

async function sendWhatsApp(
  to: string,
  eventTitle: string,
  eventDate: string,
  rsvpUrl: string,
  personalMessage?: string,
): Promise<void> {
  const from = process.env.TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886';
  const body = `🎉 *You're Invited!*\n\n*${eventTitle}*\n📅 ${eventDate}\n\n${personalMessage ? personalMessage + '\n\n' : ''}RSVP here: ${rsvpUrl}\n\n_Powered by EventNest_`;
  await twilioClient().messages.create({
    body,
    from,
    to: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`,
  });
}

async function sendSMS(
  to: string,
  eventTitle: string,
  rsvpUrl: string,
): Promise<void> {
  const from = process.env.TWILIO_PHONE_FROM!;
  await twilioClient().messages.create({
    body: `You're invited to ${eventTitle}! RSVP: ${rsvpUrl}`,
    from,
    to,
  });
}

async function sendEmail(
  to: string,
  guestName: string,
  hostName: string,
  eventTitle: string,
  eventType: string,
  eventDate: string,
  venueName: string | undefined,
  venueCity: string | undefined,
  coverImageUrl: string | undefined,
  rsvpUrl: string,
  personalMessage?: string,
): Promise<void> {
  const html = buildInviteEmailHtml({
    guestName,
    hostName,
    eventTitle,
    eventType,
    eventDate,
    venueName,
    venueCity,
    coverImageUrl,
    rsvpUrl,
    personalMessage,
  });

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `You're invited to ${eventTitle} 🎉`,
    html,
  });
}

// ─── POST /api/events/[eventId]/guests/send-invites ───────────────────────────

type RouteContext = { params: Promise<{ eventId: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { eventId } = await params;
  const user = getRequestUser(request);
  if (!user) return err('Unauthorized', 401);
  if (!hasPermission(user.role, 'guest:manage')) return err('Forbidden', 403);

  // Verify event ownership
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId)))
    .limit(1);

  if (!event) return err('Event not found', 404);
  if (user.role !== 'super_admin' && event.hostId !== user.id) return err('Forbidden', 403);

  let body: unknown;
  try { body = await request.json(); } catch { return err('Invalid JSON', 400); }

  const parsed = SendInvitesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 422 });
  }

  const { guestIds, channels, personalMessage } = parsed.data;
  const totalMessages = guestIds.length * channels.length;

  if (!checkRateLimit(eventId, totalMessages)) {
    return err('Rate limit exceeded: max 500 invites per hour per event', 429);
  }

  // Fetch target guests
  const guestRows = await db
    .select()
    .from(guests)
    .where(and(eq(guests.eventId, eventId), inArray(guests.id, guestIds)));

  const eventDateStr = new Date(event.eventDate).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  let sent   = 0;
  let failed = 0;
  const errors: string[] = [];

  // Process in batches of 50 to stay within rate limits
  const BATCH_SIZE = 50;

  for (let i = 0; i < guestRows.length; i += BATCH_SIZE) {
    const batch = guestRows.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.flatMap((guest) =>
        channels.map(async (channel) => {
          const rsvpUrl = `${APP_URL}/invite/${guest.inviteToken}`;

          try {
            if (channel === 'whatsapp' && guest.phone) {
              await sendWhatsApp(guest.phone, event.title, eventDateStr, rsvpUrl, personalMessage);
            } else if (channel === 'sms' && guest.phone) {
              await sendSMS(guest.phone, event.title, rsvpUrl);
            } else if (channel === 'email' && guest.email) {
              await sendEmail(
                guest.email,
                guest.fullName,
                'Your Host', // host name would need a join; simplified here
                event.title,
                event.eventType,
                eventDateStr,
                event.venueName ?? undefined,
                event.venueCity ?? undefined,
                event.coverImageUrl ?? undefined,
                rsvpUrl,
                personalMessage,
              );
            } else {
              return; // skip if no contact for this channel
            }

            sent++;
          } catch (e: unknown) {
            failed++;
            errors.push(`${guest.fullName} (${channel}): ${e instanceof Error ? e.message : 'Unknown error'}`);
          }
        }),
      ),
    );

    // Mark invites sent in DB for this batch
    await db
      .update(guests)
      .set({ inviteSentAt: new Date() })
      .where(and(
        eq(guests.eventId, eventId),
        inArray(guests.id, batch.map((g) => g.id)),
      ));
  }

  return NextResponse.json({ sent, failed, errors: errors.slice(0, 20) });
}
