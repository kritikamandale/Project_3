import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import {
  getRawRefreshToken,
  refreshSession,
  setSessionCookies,
  setCSRFCookie,
  clearSessionCookies,
} from '@/lib/auth/session';
import { decodeTokenUnsafe } from '@/lib/auth/jwt';
import { db, users, auditLogs } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const ip        = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const userAgent = request.headers.get('user-agent') ?? undefined;

  const rawRefreshToken = await getRawRefreshToken();

  if (!rawRefreshToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
  }

  const result = await refreshSession(rawRefreshToken);

  if (!result) {
    // Token invalid or replayed — clear all cookies and force re-login
    await clearSessionCookies();
    return NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 });
  }

  const { accessToken, refreshToken } = result;

  await setSessionCookies(accessToken, refreshToken);

  // Rotate CSRF token together with session
  const csrfToken = nanoid(32);
  await setCSRFCookie(csrfToken);

  // Fetch fresh user data for the response
  const payload = decodeTokenUnsafe(accessToken);
  let publicUser = null;

  if (payload?.sub) {
    const [user] = await db
      .select({
        id:         users.id,
        email:      users.email,
        fullName:   users.fullName,
        role:       users.role,
        avatarUrl:  users.avatarUrl,
        isEmailVerified: users.isEmailVerified,
        createdAt:  users.createdAt,
        updatedAt:  users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    if (user) {
      publicUser = {
        id:         user.id,
        email:      user.email,
        name:       user.fullName,
        role:       user.role,
        avatar:     user.avatarUrl,
        isVerified: user.isEmailVerified,
        createdAt:  user.createdAt,
        updatedAt:  user.updatedAt,
      };

      await db.insert(auditLogs).values({
        userId:       user.id,
        action:       'token.refresh',
        resourceType: 'session',
        ipAddress:    ip,
        userAgent,
        success:      true,
        metadata:     {},
      });
    }
  }

  return NextResponse.json({ success: true, user: publicUser, csrfToken });
}
