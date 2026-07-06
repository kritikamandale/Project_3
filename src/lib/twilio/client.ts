import twilio from 'twilio';

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token || sid.startsWith('your_') || !sid.startsWith('AC')) {
    return null;
  }
  return twilio(sid, token);
}

export function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendPhoneOTP(to: string, otp: string): Promise<void> {
  const client = getClient();
  if (!client) return; // Twilio not configured — skip silently

  const from = process.env.TWILIO_PHONE_FROM ?? process.env.TWILIO_WHATSAPP_FROM;
  if (!from) return;

  await client.messages.create({
    body: `Your Milap verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`,
    from,
    to,
  });
}

export async function sendWhatsAppOTP(to: string, otp: string): Promise<void> {
  const client = getClient();
  if (!client) return;

  const from = process.env.TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886';
  const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

  await client.messages.create({
    body: `Your Milap OTP is *${otp}*. Valid for 10 minutes.`,
    from,
    to: formattedTo,
  });
}
