import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, events } from '@/lib/db';

function getUser(req: NextRequest) {
  const id   = req.headers.get('x-user-id');
  const role = req.headers.get('x-user-role') ?? '';
  return id ? { id, role } : null;
}

type RouteCtx = { params: Promise<{ eventId: string }> };

// GET /api/memories/[eventId]/share — returns a shareable album URL
export async function GET(req: NextRequest, { params }: RouteCtx) {
  const { eventId } = await params;
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [ev] = await db
    .select({ hostId: events.hostId, inviteToken: events.inviteToken, title: events.title })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!ev) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  if (user.role !== 'super_admin' && ev.hostId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const shareUrl = `${appUrl}/album/${eventId}?share=${ev.inviteToken}`;

  return NextResponse.json({ shareUrl, eventTitle: ev.title });
}
