import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db, users, auditLogs } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { ChangePasswordSchema } from '@/lib/validators/auth.schema';

export async function POST(req: NextRequest) {
  const jar = await cookies();
  const token = jar.get('milap_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let user;
  try { user = await verifyAccessToken(token); }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }); }

  const parsed = ChangePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { currentPassword, newPassword } = parsed.data;

  const [existing] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, user.sub))
    .limit(1);

  if (!existing?.passwordHash) {
    return NextResponse.json({ error: 'No password set for this account' }, { status: 400 });
  }

  const isValid = await bcrypt.compare(currentPassword, existing.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 });
  }

  const newHash = await bcrypt.hash(newPassword, 12);

  await db
    .update(users)
    .set({ passwordHash: newHash, updatedAt: new Date() })
    .where(eq(users.id, user.sub));

  await db.insert(auditLogs).values({
    userId:       user.sub,
    action:       'auth.change_password',
    resourceType: 'user',
    resourceId:   user.sub,
    success:      true,
    metadata:     {},
  });

  return NextResponse.json({ success: true, message: 'Password updated successfully' });
}
