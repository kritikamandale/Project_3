import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// ─── Mock Redis before importing rateLimit ────────────────────────────────────
jest.mock('@/lib/redis/client', () => ({
  redis: {
    pipeline: jest.fn(() => ({
      zremrangebyscore: jest.fn().mockReturnThis(),
      zadd:            jest.fn().mockReturnThis(),
      zcard:           jest.fn().mockReturnThis(),
      pexpire:         jest.fn().mockReturnThis(),
      exec: jest.fn<() => Promise<(unknown[] | null)[]>>().mockResolvedValue([null, null, [null, 1], null]),
    })),
  },
}));

import { rateLimit } from '@/lib/utils/rateLimit';
import { NextRequest } from 'next/server';

function makeRequest(ip = '1.2.3.4', path = '/api/auth/login') {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: { 'x-forwarded-for': ip },
  });
}

describe('rateLimit (synchronous in-memory)', () => {
  it('allows requests within the limit', () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 5 });
    const req     = makeRequest('10.0.0.1', '/api/test-1');
    for (let i = 0; i < 5; i++) {
      expect(limiter(req)).toBeNull();
    }
  });

  it('returns 429 when limit is exceeded', () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 3 });
    const req     = makeRequest('10.0.0.2', '/api/test-2');
    for (let i = 0; i < 3; i++) limiter(req);
    const response = limiter(req);
    expect(response).not.toBeNull();
    expect(response!.status).toBe(429);
  });

  it('includes Retry-After header in 429 response', () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 1 });
    const req     = makeRequest('10.0.0.3', '/api/test-3');
    limiter(req); // consume the 1 allowed
    const response = limiter(req);
    expect(response?.headers.get('Retry-After')).toBeTruthy();
  });

  it('tracks different IPs independently', () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 2 });
    const req1    = makeRequest('10.0.1.1', '/api/test-4');
    const req2    = makeRequest('10.0.1.2', '/api/test-4');

    limiter(req1);
    limiter(req1);
    // req1 is now at limit
    expect(limiter(req1)?.status).toBe(429);
    // req2 is a different IP — should still be allowed
    expect(limiter(req2)).toBeNull();
  });

  it('resets count after the window expires', () => {
    jest.useFakeTimers();
    const limiter = rateLimit({ windowMs: 1_000, max: 1 });
    const req     = makeRequest('10.0.2.1', '/api/test-5');

    limiter(req); // use up the 1 request
    expect(limiter(req)?.status).toBe(429);

    // Advance past window
    jest.advanceTimersByTime(1_500);
    expect(limiter(req)).toBeNull();
    jest.useRealTimers();
  });
});

describe('rateLimit response headers', () => {
  it('returns X-RateLimit-Limit header', () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 5 });
    const req     = makeRequest('10.0.3.1', '/api/test-6');
    // Exhaust the limit
    for (let i = 0; i < 5; i++) limiter(req);
    const response = limiter(req);
    expect(response?.headers.get('X-RateLimit-Limit')).toBe('5');
    expect(response?.headers.get('X-RateLimit-Remaining')).toBe('0');
  });
});
