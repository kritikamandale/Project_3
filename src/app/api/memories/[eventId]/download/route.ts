import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, eventMemories, events } from '@/lib/db';
import { cloudinary } from '@/lib/cloudinary/config';

function getUser(req: NextRequest) {
  const id   = req.headers.get('x-user-id');
  const role = req.headers.get('x-user-role') ?? '';
  return id ? { id, role } : null;
}

type RouteCtx = { params: Promise<{ eventId: string }> };

// GET /api/memories/[eventId]/download — generate a Cloudinary ZIP download URL
export async function GET(req: NextRequest, { params }: RouteCtx) {
  const { eventId } = await params;
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [ev] = await db
    .select({ hostId: events.hostId, title: events.title, inviteToken: events.inviteToken })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!ev) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  const url = new URL(req.url);
  const shareToken = url.searchParams.get('share');
  const canDownload =
    user.role === 'super_admin' ||
    ev.hostId === user.id ||
    (shareToken && shareToken === ev.inviteToken);

  if (!canDownload) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const memories = await db
    .select({ cloudinaryPublicId: eventMemories.cloudinaryPublicId })
    .from(eventMemories)
    .where(eq(eventMemories.eventId, eventId));

  if (!memories.length) {
    return NextResponse.json({ error: 'No photos to download' }, { status: 404 });
  }

  const publicIds = memories.map((m) => m.cloudinaryPublicId);

  const zipUrl = cloudinary.utils.download_zip_url({
    public_ids:         publicIds,
    resource_type:      'image',
    target_public_id:   `milap-${eventId}-album`,
    flatten_folders:    true,
    expires_at:         Math.floor(Date.now() / 1000) + 3600,
  });

  return NextResponse.redirect(zipUrl);
}
