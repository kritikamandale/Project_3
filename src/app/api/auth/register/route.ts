import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { eq, or } from 'drizzle-orm';
import { db, users, auditLogs } from '@/lib/db';
import { registerSchema } from '@/lib/validators/auth.schema';
import { sendVerificationEmail } from '@/lib/resend/client';
import { sendPhoneOTP, generateOTP } from '@/lib/twilio/client';

export async function POST(request: NextRequest) {
  try {
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

    const { fullName, email, phone, password, role } = parsed.data;

    const cleanName  = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(or(eq(users.email, cleanEmail), eq(users.phone, cleanPhone)))
      .limit(1);

    if (existing.length > 0) {
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

    const [newUser] = await db
      .insert(users)
      .values({
        fullName:               cleanName,
        email:                  cleanEmail,
        phone:                  cleanPhone,
        passwordHash,
        role:                   role as 'host' | 'vendor',
        emailVerificationToken: verificationToken,
        phoneOtp:               otp,
        otpExpiresAt,
      })
      .returning({ id: users.id, email: users.email, fullName: users.fullName });

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
      { success: true, message: 'Account created successfully.' },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const cause = err instanceof Error && (err as NodeJS.ErrnoException).cause
      ? String((err as NodeJS.ErrnoException).cause)
      : undefined;
    const pg = (err as Record<string, unknown>)?.['detail'] ?? (err as Record<string, unknown>)?.['hint'] ?? undefined;
    console.error('[register] ERROR:', message, cause);
    return NextResponse.json(
      { error: 'Registration failed', detail: message, cause, pg },
      { status: 500 }
    );
  }
}
