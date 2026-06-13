import { type NextRequest } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { db, users } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { z } from 'zod/v4';

const bodySchema = z.object({ token: z.string().min(1) });

// ── POST /api/notifications/token — save FCM device token ─────────────────────

export async function POST(req: NextRequest) {
  const jar = await cookies();
  const sessionToken = jar.get('eventnest_session')?.value;
  if (!sessionToken) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let user;
  try { user = await verifyAccessToken(sessionToken); } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: 'Invalid token' }, { status: 400 });

  const { token } = parsed.data;

  // Merge fcmToken into users.metadata jsonb
  await db
    .update(users)
    .set({
      metadata: sql`COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({ fcmToken: token })}::jsonb`,
    })
    .where(eq(users.id, user.sub));

  return Response.json({ success: true });
}
