import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis/client';

// ─── Per-route limits ─────────────────────────────────────────────────────────

export const RATE_LIMITS = {
  login:                 { windowMs: 15 * 60 * 1000, max: 10 },
  register:              { windowMs: 60 * 60 * 1000, max: 5 },
  'forgot-password':     { windowMs: 60 * 60 * 1000, max: 3 },
  'events-create':       { windowMs: 60 * 60 * 1000, max: 20 },
  'ai-chat':             { windowMs: 24 * 60 * 60 * 1000, max: 20 },
  'ai-chat-premium':     { windowMs: 24 * 60 * 60 * 1000, max: 100 },
  'payments-create':     { windowMs: 60 * 60 * 1000, max: 10 },
  general:               { windowMs: 15 * 60 * 1000, max: 100 },
} as const;

export type RateLimitRoute = keyof typeof RATE_LIMITS;

interface LimitConfig {
  windowMs: number;
  max: number;
}

// ─── In-memory fallback (single-instance only) ────────────────────────────────

const memStore = new Map<string, { count: number; resetAt: number }>();

function memoryCheck(
  key: string,
  cfg: LimitConfig,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = memStore.get(key);
  if (!entry || now > entry.resetAt) {
    memStore.set(key, { count: 1, resetAt: now + cfg.windowMs });
    return { allowed: true, remaining: cfg.max - 1, resetAt: now + cfg.windowMs };
  }
  entry.count++;
  return {
    allowed: entry.count <= cfg.max,
    remaining: Math.max(0, cfg.max - entry.count),
    resetAt: entry.resetAt,
  };
}

// ─── Redis sliding-window (sorted set) ───────────────────────────────────────

async function redisCheck(
  key: string,
  cfg: LimitConfig,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();
  const windowStart = now - cfg.windowMs;
  const resetAt = now + cfg.windowMs;
  const member = `${now}:${Math.random().toString(36).slice(2)}`;

  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(key, '-inf', windowStart);
  pipeline.zadd(key, now, member);
  pipeline.zcard(key);
  pipeline.pexpire(key, cfg.windowMs);
  const results = await pipeline.exec();

  const count = (results?.[2]?.[1] as number) ?? 1;
  return {
    allowed: count <= cfg.max,
    remaining: Math.max(0, cfg.max - count),
    resetAt,
  };
}

// ─── Main rateLimiter ─────────────────────────────────────────────────────────

/**
 * Sliding-window rate limiter backed by Redis (in-memory fallback on error).
 * Keyed by authenticated userId when available, IP otherwise.
 *
 * Usage in API route:
 *   const limited = await rateLimiter('login', request);
 *   if (limited) return limited;
 */
export async function rateLimiter(
  route: string,
  request: NextRequest,
  override?: LimitConfig,
): Promise<NextResponse | null> {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

  const userId = request.headers.get('x-user-id');
  const identifier = userId ?? ip;
  const key = `rl:${route}:${identifier}`;
  const cfg = override ?? RATE_LIMITS[route as RateLimitRoute] ?? RATE_LIMITS.general;

  let result: { allowed: boolean; remaining: number; resetAt: number };
  try {
    result = await redisCheck(key, cfg);
  } catch {
    result = memoryCheck(key, cfg);
  }

  if (!result.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.', code: 'RATE_LIMITED' },
      {
        status: 429,
        headers: {
          'Retry-After':          String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit':    String(cfg.max),
          'X-RateLimit-Remaining':'0',
          'X-RateLimit-Reset':    String(Math.ceil(result.resetAt / 1000)),
        },
      },
    );
  }

  return null;
}

// ─── Legacy synchronous helper (kept for middleware compatibility) ─────────────

export function rateLimit(cfg: LimitConfig) {
  return function check(request: NextRequest): NextResponse | null {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'unknown';
    const key   = `rl:${ip}:${request.nextUrl.pathname}`;
    const check = memoryCheck(key, cfg);

    if (!check.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After':          String(Math.ceil((check.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Limit':    String(cfg.max),
            'X-RateLimit-Remaining':'0',
          },
        },
      );
    }

    return null;
  };
}
