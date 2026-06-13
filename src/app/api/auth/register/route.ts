import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { eq, or } from 'drizzle-orm';
import { db, users, auditLogs } from '@/lib/db';
import { registerSchema } from '@/lib/validators/auth.schema';
import { sanitizeText } from '@/lib/utils/sanitize';
import { rateLimit } from '@/lib/utils/rateLimit';
import { sendVerificationEmail } from '@/lib/resend/client';
import { sendPhoneOTP, generateOTP } from '@/lib/twilio/client';

const limiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5 });

export async function POST(request: NextRequest) {
  const limited = limiter(request);
  if (limited) return limited;

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { name, email, phone, password, role } = parsed.data;

  // Sanitize all text inputs before DB write
  const cleanName  = sanitizeText(name.trim());
  const cleanEmail = sanitizeText(email.trim().toLowerCase());
  const cleanPhone = sanitizeText(phone.trim());

  // Check for existing email OR phone without revealing which one exists
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(or(eq(users.email, cleanEmail), eq(users.phone, cleanPhone)))
    .limit(1);

  if (existing.length > 0) {
    // Intentional: same error for both email & phone collision (anti-enumeration)
    return NextResponse.json(
      { error: 'An account with these details already exists.' },
      { status: 409 }
    );
  }

  const [passwordHash, verificationToken, otp] = await Promise.all([
    bcrypt.hash(password, 12),
    Promise.resolve(nanoid(64)),
    Promise.resolve(generateOTP()),
  ]);

  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const otpHash      = await bcrypt.hash(otp, 10);

  const [newUser] = await db
    .insert(users)
    .values({
      fullName:               cleanName,
      email:                  cleanEmail,
      phone:                  cleanPhone,
      passwordHash,
      role:                   role as 'host' | 'vendor',
      emailVerificationToken: verificationToken,
      phoneOtp:               otpHash,
      otpExpiresAt,
    })
    .returning({ id: users.id, email: users.email, fullName: users.fullName });

  // Fire email & SMS in parallel — don't block the response on SMS failure
  await Promise.allSettled([
    sendVerificationEmail(newUser.email, newUser.fullName, verificationToken),
    sendPhoneOTP(cleanPhone, otp),
  ]);

  await db.insert(auditLogs).values({
    userId:       newUser.id,
    action:       'user.register',
    resourceType: 'user',
    resourceId:   newUser.id,
    ipAddress:    ip,
    userAgent:    request.headers.get('user-agent') ?? undefined,
    success:      true,
    metadata:     { role },
  });

  return NextResponse.json(
    { success: true, message: 'Verification email sent. Please check your inbox.' },
    { status: 201 }
  );
}
