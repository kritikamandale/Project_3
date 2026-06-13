import { type NextRequest } from 'next/server';
import { eq, and, desc, count } from 'drizzle-orm';
import { db, notifications } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { cacheGet, cacheSet, cacheDel } from '@/lib/redis/client';

const PAGE_SIZE = 20;

async function getAuthUser() {
  const jar = await cookies();
  const token = jar.get('eventnest_session')?.value;
  if (!token) return null;
  try { return await verifyAccessToken(token); } catch { return null; }
}

function unreadCountKey(userId: string) {
  return `notifications:unread:${userId}`;
}

// ── GET /api/notifications — list notifications (paginated, unread-first) ─────

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const page  = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const limit = Math.min(Number(searchParams.get('limit') ?? PAGE_SIZE), 50);
  const offset = (page - 1) * limit;

  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.sub))
    .orderBy(desc(notifications.isRead), desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(notifications)
    .where(eq(notifications.userId, user.sub));

  // Unread count — serve from Redis cache
  let unreadCount = await cacheGet<number>(unreadCountKey(user.sub));
  if (unreadCount === null) {
    const [{ unread }] = await db
      .select({ unread: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, user.sub), eq(notifications.isRead, false)));
    unreadCount = unread;
    await cacheSet(unreadCountKey(user.sub), unreadCount, 60);
  }

  return Response.json({ notifications: rows, total, unreadCount, page, limit });
}

// ── DELETE /api/notifications/clear — remove all read notifications ───────────

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.userId, user.sub),
        eq(notifications.isRead, true),
      ),
    );

  await cacheDel(unreadCountKey(user.sub));
  return Response.json({ success: true });
}
