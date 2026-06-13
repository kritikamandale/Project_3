import { NextRequest, NextResponse } from 'next/server';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod/v4';
import { db, eventMemories, events } from '@/lib/db';
import { thumbnailUrl } from '@/lib/cloudinary/config';

function getUser(req: NextRequest) {
  const id   = req.headers.get('x-user-id');
  const role = req.headers.get('x-user-role') ?? '';
  return id ? { id, role } : null;
}

function err(msg: string, status: number) {
  return NextResponse.json({ error: msg }, { status });
}

type RouteCtx = { params: Promise<{ eventId: string }> };

const PostSchema = z.object({
  cloudinaryPublicId: z.string().min(1).max(255),
  url:                z.string().url(),
  caption:            z.string().max(500).optional(),
  width:              z.number().int().optional(),
  height:             z.number().int().optional(),
  fileSize:           z.number().int().optional(),
  mimeType:           z.string().max(50).optional(),
  tags:               z.array(z.string()).optional(),
  uploadedByGuest:    z.string().optional(),
});

// GET /api/memories/[eventId] — list all memories for an event
export async function GET(req: NextRequest, { params }: RouteCtx) {
  const { eventId } = await params;
  const user = getUser(req);
  if (!user) return err('Unauthorized', 401);

  const [ev] = await db
    .select({ hostId: events.hostId, isPrivate: events.isPrivate, inviteToken: events.inviteToken })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!ev) return err('Event not found', 404);

  const url = new URL(req.url);
  const shareToken = url.searchParams.get('share');

  const canView =
    user.role === 'super_admin' ||
    ev.hostId === user.id ||
    (shareToken && shareToken === ev.inviteToken);

  if (!canView) return err('Forbidden', 403);

  const memories = await db
    .select()
    .from(eventMemories)
    .where(eq(eventMemories.eventId, eventId))
    .orderBy(desc(eventMemories.createdAt));

  return NextResponse.json({ memories });
}

// POST /api/memories/[eventId] — save a new memory after Cloudinary upload
export async function POST(req: NextRequest, { params }: RouteCtx) {
  const { eventId } = await params;
  const user = getUser(req);
  if (!user) return err('Unauthorized', 401);

  const [ev] = await db
    .select({ hostId: events.hostId })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!ev) return err('Event not found', 404);
  if (user.role !== 'super_admin' && ev.hostId !== user.id) return err('Forbidden', 403);

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 });
  }

  const { cloudinaryPublicId, url: photoUrl, caption, width, height, fileSize, mimeType, tags, uploadedByGuest } = parsed.data;

  const thumb = thumbnailUrl(cloudinaryPublicId);

  const [memory] = await db
    .insert(eventMemories)
    .values({
      eventId,
      uploadedBy:          user.id,
      cloudinaryPublicId,
      url:                 photoUrl,
      thumbnailUrl:        thumb,
      caption,
      width,
      height,
      fileSize,
      mimeType,
      tags:                tags ?? [],
      metadata:            uploadedByGuest ? { uploadedByGuest } : {},
    })
    .returning();

  return NextResponse.json({ memory }, { status: 201 });
}
