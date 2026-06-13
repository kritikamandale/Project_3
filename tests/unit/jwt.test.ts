import { describe, it, expect, beforeAll } from '@jest/globals';
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeTokenUnsafe,
  getTokenExpiryMs,
} from '@/lib/auth/jwt';

const PAYLOAD = { sub: 'user-123', email: 'test@example.com', role: 'host' as const };

describe('JWT — signAccessToken / verifyAccessToken', () => {
  it('produces a non-empty token string', async () => {
    const token = await signAccessToken(PAYLOAD);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('round-trips payload correctly', async () => {
    const token = await signAccessToken(PAYLOAD);
    const decoded = await verifyAccessToken(token);
    expect(decoded.sub).toBe(PAYLOAD.sub);
    expect(decoded.email).toBe(PAYLOAD.email);
    expect(decoded.role).toBe(PAYLOAD.role);
  });

  it('includes a unique jti per token', async () => {
    const t1 = await signAccessToken(PAYLOAD);
    const t2 = await signAccessToken(PAYLOAD);
    const d1 = decodeTokenUnsafe(t1);
    const d2 = decodeTokenUnsafe(t2);
    expect(d1?.jti).toBeTruthy();
    expect(d2?.jti).toBeTruthy();
    expect(d1?.jti).not.toBe(d2?.jti);
  });

  it('rejects a tampered token', async () => {
    const token = await signAccessToken(PAYLOAD);
    const [h, , sig] = token.split('.');
    // Tamper with the payload part
    const fakePayload = Buffer.from(JSON.stringify({ sub: 'attacker', role: 'super_admin' })).toString('base64url');
    const tampered = `${h}.${fakePayload}.${sig}`;
    await expect(verifyAccessToken(tampered)).rejects.toThrow();
  });

  it('rejects a token signed with the wrong secret', async () => {
    // Save and override the secret
    const original = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'wrong-secret-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
    const badToken = await signAccessToken(PAYLOAD);
    process.env.JWT_SECRET = original;
    await expect(verifyAccessToken(badToken)).rejects.toThrow();
  });
});

describe('JWT — signRefreshToken / verifyRefreshToken', () => {
  it('round-trips refresh token payload', async () => {
    const token = await signRefreshToken(PAYLOAD);
    const decoded = await verifyRefreshToken(token);
    expect(decoded.sub).toBe(PAYLOAD.sub);
  });

  it('rejects an access token when verifying as refresh token', async () => {
    const accessToken = await signAccessToken(PAYLOAD);
    // verifyRefreshToken uses a different secret — must throw
    await expect(verifyRefreshToken(accessToken)).rejects.toThrow();
  });
});

describe('decodeTokenUnsafe', () => {
  it('returns payload without verification', async () => {
    const token = await signAccessToken(PAYLOAD);
    const decoded = decodeTokenUnsafe(token);
    expect(decoded?.sub).toBe(PAYLOAD.sub);
  });

  it('returns null for garbage input', () => {
    expect(decodeTokenUnsafe('not.a.jwt')).toBeNull();
    expect(decodeTokenUnsafe('')).toBeNull();
  });
});

describe('getTokenExpiryMs', () => {
  it('returns a future timestamp for a fresh token', async () => {
    const token = await signAccessToken(PAYLOAD);
    const expiryMs = getTokenExpiryMs(token);
    expect(expiryMs).toBeTruthy();
    expect(expiryMs!).toBeGreaterThan(Date.now());
  });

  it('returns null for an invalid token', () => {
    expect(getTokenExpiryMs('garbage')).toBeNull();
  });
});
