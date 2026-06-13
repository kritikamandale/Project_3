import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db, users, auditLogs } from '@/lib/db';
import { loginSchema } from '@/lib/validators/auth.schema';
import { rateLimit } from '@/lib/utils/rateLimit';
import { createSession, setSessionCookies, setCSRFCookie } from '@/lib/auth/session';
import type { UserRole } from '@/types/auth.types';

const LOCK_THRESHOLD = 5;
const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

// Generic error for any credential failure — prevents account enumeration
const INVALID_CREDS = 'Invalid credentials';

export async function POST(request: NextRequest) {
  const limited = limiter(request);
  if (limited) return limited;

  const ip        = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const userAgent = request.headers.get('user-agent') ?? undefined;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: INVALID_CREDS }, { status: 401 });
  }

  const { email, password } = parsed.data;
  const cleanEmail = email.trim().toLowerCase();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, cleanEmail))
    .limit(1);

  // Account doesn't exist — return same error, constant-time-safe by doing a dummy compare
  if (!user) {
    await bcrypt.compare(password, '$2b$12$invalidhashpaddingtoconsumetime00000000000000000000000');
    await writeAuditLog(null, ip, userAgent, false, 'user not found');
    return NextResponse.json({ error: INVALID_CREDS }, { status: 401 });
  }

  // Account lockout check
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await writeAuditLog(user.id, ip, userAgent, false, 'account locked');
    return NextResponse.json(
      { error: 'Account temporarily locked. Try again later.' },
      { status: 423 }
    );
  }

  // Inactive / deleted account
  if (!user.isActive || user.deletedAt) {
    await writeAuditLog(user.id, ip, userAgent, false, 'account inactive');
    return NextResponse.json({ error: INVALID_CREDS }, { status: 401 });
  }

  const passwordValid = user.passwordHash
    ? await bcrypt.compare(password, user.passwordHash)
    : false;

  if (!passwordValid) {
    const newAttempts = (user.failedLoginAttempts ?? 0) + 1;
    const shouldLock  = newAttempts >= LOCK_THRESHOLD;

    await db
      .update(users)
      .set({
        failedLoginAttempts: newAttempts,
        ...(shouldLock ? { lockedUntil: new Date(Date.now() + LOCK_DURATION_MS) } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    await writeAuditLog(user.id, ip, userAgent, false, `bad password (attempt ${newAttempts})`);
    return NextResponse.json({ error: INVALID_CREDS }, { status: 401 });
  }

  // --- Login successful ---

  const [{ accessToken, refreshToken }] = await Promise.all([
    createSession(
      user.id,
      user.role as UserRole,
      user.email,
      { userAgent, platform: 'web' },
      ip
    ),
    db.update(users).set({
      failedLoginAttempts: 0,
      lockedUntil:         null,
      lastLoginAt:         new Date(),
      lastLoginIp:         ip,
      updatedAt:           new Date(),
    }).where(eq(users.id, user.id)),
  ]);

  await setSessionCookies(accessToken, refreshToken);

  // CSRF token — double-submit pattern
  const csrfToken = nanoid(32);
  await setCSRFCookie(csrfToken);

  await writeAuditLog(user.id, ip, userAgent, true);

  const publicUser = {
    id:         user.id,
    email:      user.email,
    name:       user.fullName,
    role:       user.role,
    avatar:     user.avatarUrl,
    isVerified: user.isEmailVerified,
    createdAt:  user.createdAt,
    updatedAt:  user.updatedAt,
  };

  return NextResponse.json({ success: true, user: publicUser, csrfToken });
}

async function writeAuditLog(
  userId: string | null,
  ip: string,
  userAgent: string | undefined,
  success: boolean,
  errorMessage?: string
) {
  await db.insert(auditLogs).values({
    userId:       userId ?? undefined,
    action:       'user.login',
    resourceType: 'user',
    resourceId:   userId ?? undefined,
    ipAddress:    ip,
    userAgent,
    success,
    errorMessage,
    metadata:     {},
  });
}
