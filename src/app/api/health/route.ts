import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { redis } from '@/lib/redis/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const checks: Record<string, 'ok' | 'error'> = {};
  const details: Record<string, string> = {};

  // ── Database ────────────────────────────────────────────────────────────────
  try {
    await db.execute(sql`SELECT 1`);
    checks.database = 'ok';
  } catch (err) {
    checks.database = 'error';
    details.database = (err as Error).message;
  }

  // ── Redis ───────────────────────────────────────────────────────────────────
  try {
    const pong = await redis.ping();
    checks.redis = pong === 'PONG' ? 'ok' : 'error';
  } catch (err) {
    checks.redis = 'error';
    details.redis = (err as Error).message;
  }

  const healthy = Object.values(checks).every((s) => s === 'ok');

  return NextResponse.json(
    {
      status: healthy ? 'healthy' : 'degraded',
      checks,
      ...(Object.keys(details).length > 0 && process.env.NODE_ENV !== 'production'
        ? { details }
        : {}),
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? '0.1.0',
    },
    { status: healthy ? 200 : 503 },
  );
}
