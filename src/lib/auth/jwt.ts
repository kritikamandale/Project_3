import { SignJWT, jwtVerify } from 'jose';
import { nanoid } from 'nanoid';
import type { JWTPayload, UserRole } from '@/types/auth.types';

const accessSecret  = new TextEncoder().encode(process.env.JWT_SECRET!);
const refreshSecret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!);

export interface TokenPayloadInput {
  sub: string;
  email: string;
  role: UserRole;
}

export async function signAccessToken(payload: TokenPayloadInput): Promise<string> {
  return new SignJWT({ ...payload, jti: nanoid() })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_ACCESS_EXPIRY ?? '15m')
    .sign(accessSecret);
}

export async function signRefreshToken(payload: TokenPayloadInput): Promise<string> {
  return new SignJWT({ ...payload, jti: nanoid() })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_REFRESH_EXPIRY ?? '7d')
    .sign(refreshSecret);
}

export async function verifyAccessToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, accessSecret);
  return payload as unknown as JWTPayload;
}

export async function verifyRefreshToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, refreshSecret);
  return payload as unknown as JWTPayload;
}

export function decodeTokenUnsafe(token: string): JWTPayload | null {
  try {
    const [, payloadB64] = token.split('.');
    const json = Buffer.from(payloadB64, 'base64url').toString('utf8');
    return JSON.parse(json) as JWTPayload;
  } catch {
    return null;
  }
}

export function getTokenExpiryMs(token: string): number | null {
  const decoded = decodeTokenUnsafe(token);
  if (!decoded?.exp) return null;
  return decoded.exp * 1000;
}
