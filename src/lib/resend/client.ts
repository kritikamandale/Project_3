import { Resend } from 'resend';

const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@eventnest.in';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key || key.startsWith('your_')) return null;
  return new Resend(key);
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const resend = getResend();
  if (!resend) return; // not configured — skip silently

  const link = `${APP_URL}/api/auth/verify-email?token=${token}`;
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Verify your EventNest account',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2>Welcome to EventNest, ${name}!</h2>
        <p>Please verify your email address to activate your account.</p>
        <a href="${link}"
           style="display:inline-block;padding:12px 24px;background:#b45309;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Verify Email
        </a>
        <p style="color:#6b7280;font-size:13px;margin-top:24px">
          Link expires in 24 hours. If you didn't create an account, ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const link = `${APP_URL}/reset-password?token=${token}`;
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Reset your EventNest password',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2>Password Reset Request</h2>
        <p>Hi ${name}, click below to reset your password.</p>
        <a href="${link}"
           style="display:inline-block;padding:12px 24px;background:#b45309;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Reset Password
        </a>
        <p style="color:#6b7280;font-size:13px;margin-top:24px">
          Link expires in 1 hour. If you didn't request this, ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Welcome to EventNest!',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2>Your account is active, ${name}!</h2>
        <p>Start planning your perfect event with EventNest.</p>
        <a href="${APP_URL}/host/dashboard"
           style="display:inline-block;padding:12px 24px;background:#b45309;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Go to Dashboard
        </a>
      </div>
    `,
  });
}
