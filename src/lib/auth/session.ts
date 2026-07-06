import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { eq, and } from 'drizzle-orm';
import { db, userSessions } from '@/lib/db';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  type TokenPayloadInput,
} from './jwt';
import type { JWTPayload, UserRole } from '@/types/auth.types';

const ACCESS_COOKIE  = 'milap_session';
const REFRESH_COOKIE = 'milap_refresh';
const CSRF_COOKIE    = 'milap_csrf';

const BASE_COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
} as const;

// ─── Cookie helpers ────────────────────────────────────────────────────────────

export async function setSessionCookies(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  const jar = await cookies();

  jar.set(ACCESS_COOKIE, accessToken, {
    ...BASE_COOKIE,
    path: '/',
    maxAge: 15 * 60,
  });

  jar.set(REFRESH_COOKIE, refreshToken, {
    ...BASE_COOKIE,
    path: '/api/auth/refresh',
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function clearSessionCookies(): Promise<void> {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
  jar.delete(CSRF_COOKIE);
}

export async function getAccessToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(ACCESS_COOKIE)?.value ?? null;
}

export async function getRawRefreshToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(REFRESH_COOKIE)?.value ?? null;
}

// ─── CSRF double-submit cookie ─────────────────────────────────────────────────

export async function setCSRFCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(CSRF_COOKIE, token, {
    httpOnly: false,  // must be readable by JS so the client can include it in headers
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 15 * 60,
  });
}

// ─── DB session management ────────────────────────────────────────────────────

export interface DeviceInfo {
  userAgent?: string;
  platform?: string;
}

export async function createSession(
  userId: string,
  role: UserRole,
  email: string,
  deviceInfo: DeviceInfo,
  ipAddress: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const payload: TokenPayloadInput = { sub: userId, role, email };

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(payload),
    signRefreshToken(payload),
  ]);

  const tokenHash = await bcrypt.hash(refreshToken, 12);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(userSessions).values({
    userId,
    refreshTokenHash: tokenHash,
    deviceInfo: deviceInfo as Record<string, unknown>,
    ipAddress,
    userAgent: deviceInfo.userAgent,
    isValid: true,
    expiresAt,
  });

  return { accessToken, refreshToken };
}

export async function refreshSession(rawRefreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> {
  let payload: JWTPayload;
  try {
    payload = await verifyRefreshToken(rawRefreshToken);
  } catch {
    return null;
  }

  // Find all valid sessions for this user and check against each stored hash
  const sessions = await db
    .select()
    .from(userSessions)
    .where(
      and(
        eq(userSessions.userId, payload.sub),
        eq(userSessions.isValid, true)
      )
    );

  let matchedSession: typeof sessions[0] | null = null;
  for (const session of sessions) {
    const matches = await bcrypt.compare(rawRefreshToken, session.refreshTokenHash);
    if (matches) {
      matchedSession = session;
      break;
    }
  }

  if (!matchedSession || matchedSession.expiresAt < new Date()) {
    return null;
  }

  // Invalidate old session (rotation — replay attack protection)
  await db
    .update(userSessions)
    .set({ isValid: false })
    .where(eq(userSessions.id, matchedSession.id));

  // Issue new token pair
  const tokenPayload: TokenPayloadInput = {
    sub: payload.sub,
    role: payload.role,
    email: payload.email,
  };

  const [newAccessToken, newRefreshToken] = await Promise.all([
    signAccessToken(tokenPayload),
    signRefreshToken(tokenPayload),
  ]);

  const newHash    = await bcrypt.hash(newRefreshToken, 12);
  const expiresAt  = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(userSessions).values({
    userId:           payload.sub,
    refreshTokenHash: newHash,
    deviceInfo:       matchedSession.deviceInfo as Record<string, unknown>,
    ipAddress:        matchedSession.ipAddress ?? undefined,
    userAgent:        matchedSession.userAgent ?? undefined,
    isValid:          true,
    expiresAt,
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function destroySession(rawRefreshToken: string): Promise<void> {
  let payload: JWTPayload;
  try {
    payload = await verifyRefreshToken(rawRefreshToken);
  } catch {
    return;
  }

  const sessions = await db
    .select()
    .from(userSessions)
    .where(
      and(
        eq(userSessions.userId, payload.sub),
        eq(userSessions.isValid, true)
      )
    );

  for (const session of sessions) {
    const matches = await bcrypt.compare(rawRefreshToken, session.refreshTokenHash);
    if (matches) {
      await db
        .update(userSessions)
        .set({ isValid: false })
        .where(eq(userSessions.id, session.id));
      break;
    }
  }
}

export async function destroyAllSessions(userId: string): Promise<void> {
  await db
    .update(userSessions)
    .set({ isValid: false })
    .where(eq(userSessions.userId, userId));
}
