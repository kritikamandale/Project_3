import { type NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, vendors } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function GET(_req: NextRequest) {
  const jar = await cookies();
  const token = jar.get('eventnest_session')?.value;
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let user;
  try { user = await verifyAccessToken(token); } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [vendor] = await db
    .select()
    .from(vendors)
    .where(eq(vendors.userId, user.sub));

  // vendor may be null — that's fine; onboarding page shows empty form
  return Response.json({ vendor: vendor ?? null });
}
