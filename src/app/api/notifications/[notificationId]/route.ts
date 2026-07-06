import { type NextRequest } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db, notifications } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { cacheSet } from '@/lib/redis/client';
import { count } from 'drizzle-orm';

async function getAuthUser() {
  const jar = await cookies();
  const token = jar.get('milap_session')?.value;
  if (!token) return null;
  try { return await verifyAccessToken(token); } catch { return null; }
}

// ── PATCH /api/notifications/:id/read — mark a single notification as read ───

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> },
) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { notificationId } = await params;

  const [updated] = await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, user.sub),
      ),
    )
    .returning();

  if (!updated) return Response.json({ error: 'Not found' }, { status: 404 });

  // Recalculate unread count and refresh Redis cache
  const [{ unread }] = await db
    .select({ unread: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, user.sub), eq(notifications.isRead, false)));
  await cacheSet(`notifications:unread:${user.sub}`, unread, 60);

  return Response.json({ success: true, notification: updated });
}
