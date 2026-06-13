import pino from 'pino';

// ─── PII masking helpers ──────────────────────────────────────────────────────

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return '***';
  const digits = phone.replace(/\D/g, '');
  return '+91****' + digits.slice(-4);
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain || !local) return '***@***';
  return local[0] + '***' + local[local.length - 1] + '@' + domain;
}

const SENSITIVE_KEYS = new Set([
  'password', 'passwordHash', 'token', 'refreshToken', 'secret',
  'key', 'bankAccount', 'cardNumber', 'cvv', 'otp', 'pin',
  'razorpaySignature', 'webhookSecret',
]);

export function maskPII(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (SENSITIVE_KEYS.has(k)) {
      out[k] = '[REDACTED]';
    } else if (k === 'phone' && typeof v === 'string') {
      out[k] = maskPhone(v);
    } else if (k === 'email' && typeof v === 'string') {
      out[k] = maskEmail(v);
    } else if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = maskPII(v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}

// ─── Logger setup ─────────────────────────────────────────────────────────────

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
  redact: {
    paths: [
      'password', 'passwordHash', 'token', 'secret',
      '*.password', '*.token', '*.secret',
    ],
    censor: '[REDACTED]',
  },
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
  },
  base: { service: 'eventnest' },
});

// ─── Audit log helper ─────────────────────────────────────────────────────────

export interface AuditEvent {
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export function logAudit(event: AuditEvent): void {
  const masked = maskPII(event as unknown as Record<string, unknown>);
  logger.info({ audit: true, ...masked }, `AUDIT:${event.action}`);
}

export function logAuthEvent(
  action: 'login' | 'logout' | 'login_failed' | 'password_reset' | 'role_change' | 'register',
  userId: string | null,
  ip: string,
  success: boolean,
  meta?: Record<string, unknown>,
): void {
  logger.info(
    {
      audit: true,
      action,
      userId,
      ip,
      success,
      ...(meta ? maskPII(meta) : {}),
    },
    `AUTH:${action}`,
  );
}

export function logPaymentEvent(
  action: string,
  orderId: string,
  amount: number,
  userId: string,
  success: boolean,
): void {
  logger.info({ audit: true, action, orderId, amount, userId, success }, `PAYMENT:${action}`);
}
