import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod/v4';
import { db, eventMemories, events } from '@/lib/db';
import { cloudinary } from '@/lib/cloudinary/config';

function getUser(req: NextRequest) {
  const id   = req.headers.get('x-user-id');
  const role = req.headers.get('x-user-role') ?? '';
  return id ? { id, role } : null;
}

function err(msg: string, status: number) {
  return NextResponse.json({ error: msg }, { status });
}

type RouteCtx = { params: Promise<{ eventId: string; memoryId: string }> };

const PatchSchema = z.object({
  caption:     z.string().max(500).optional(),
  isCover:     z.boolean().optional(),
  isHighlight: z.boolean().optional(),
  likesCount:  z.number().int().min(0).optional(),
});

async function getEventHost(eventId: string): Promise<string | null> {
  const [ev] = await db
    .select({ hostId: events.hostId })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);
  return ev?.hostId ?? null;
}

// PATCH /api/memories/[eventId]/[memoryId] — update caption, cover, highlight, likes
export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  const { eventId, memoryId } = await params;
  const user = getUser(req);
  if (!user) return err('Unauthorized', 401);

  const hostId = await getEventHost(eventId);
  if (!hostId) return err('Event not found', 404);
  if (user.role !== 'super_admin' && hostId !== user.id) return err('Forbidden', 403);

  let body: unknown;
  try { body = await req.json(); } catch { body = {}; }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return err('Invalid request', 400);

  const { caption, isCover, isHighlight, likesCount } = parsed.data;

  const updates: Partial<{ caption: string; isCover: boolean; isHighlight: boolean; likesCount: number }> = {};
  if (caption !== undefined)     updates.caption     = caption;
  if (isCover !== undefined)     updates.isCover     = isCover;
  if (isHighlight !== undefined) updates.isHighlight = isHighlight;
  if (likesCount !== undefined)  updates.likesCount  = likesCount;

  if (!Object.keys(updates).length) {
    return err('No fields to update', 400);
  }

  const [updated] = await db
    .update(eventMemories)
    .set(updates)
    .where(
      and(eq(eventMemories.id, memoryId), eq(eventMemories.eventId, eventId))
    )
    .returning();

  if (!updated) return err('Memory not found', 404);

  return NextResponse.json({ memory: updated });
}

// DELETE /api/memories/[eventId]/[memoryId] — delete from DB and Cloudinary
export async function DELETE(req: NextRequest, { params }: RouteCtx) {
  const { eventId, memoryId } = await params;
  const user = getUser(req);
  if (!user) return err('Unauthorized', 401);

  const hostId = await getEventHost(eventId);
  if (!hostId) return err('Event not found', 404);
  if (user.role !== 'super_admin' && hostId !== user.id) return err('Forbidden', 403);

  const [memory] = await db
    .select({ cloudinaryPublicId: eventMemories.cloudinaryPublicId })
    .from(eventMemories)
    .where(
      and(eq(eventMemories.id, memoryId), eq(eventMemories.eventId, eventId))
    )
    .limit(1);

  if (!memory) return err('Memory not found', 404);

  await db
    .delete(eventMemories)
    .where(
      and(eq(eventMemories.id, memoryId), eq(eventMemories.eventId, eventId))
    );

  cloudinary.uploader.destroy(memory.cloudinaryPublicId).catch((e) =>
    console.error('[Cloudinary] destroy failed:', e)
  );

  return NextResponse.json({ success: true });
}
