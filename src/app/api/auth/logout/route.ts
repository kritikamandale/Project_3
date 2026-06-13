import { NextRequest, NextResponse } from 'next/server';
import { destroySession, clearSessionCookies, getRawRefreshToken } from '@/lib/auth/session';
import { db, auditLogs } from '@/lib/db';

export async function POST(request: NextRequest) {
  const ip        = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const userAgent = request.headers.get('user-agent') ?? undefined;
  const userId    = request.headers.get('x-user-id') ?? undefined;

  const rawRefreshToken = await getRawRefreshToken();

  if (rawRefreshToken) {
    await destroySession(rawRefreshToken);
  }

  await clearSessionCookies();

  if (userId) {
    await db.insert(auditLogs).values({
      userId,
      action:       'user.logout',
      resourceType: 'user',
      resourceId:   userId,
      ipAddress:    ip,
      userAgent,
      success:      true,
      metadata:     {},
    });
  }

  return NextResponse.json({ success: true });
}
