import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendPhoneOTP(to: string, otp: string): Promise<void> {
  const from = process.env.TWILIO_PHONE_FROM ?? process.env.TWILIO_WHATSAPP_FROM;
  if (!from) throw new Error('TWILIO_PHONE_FROM is not configured');

  await client.messages.create({
    body: `Your EventNest verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`,
    from,
    to,
  });
}

export async function sendWhatsAppOTP(to: string, otp: string): Promise<void> {
  const from = process.env.TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886';
  const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

  await client.messages.create({
    body: `Your EventNest OTP is *${otp}*. Valid for 10 minutes.`,
    from,
    to: formattedTo,
  });
}
