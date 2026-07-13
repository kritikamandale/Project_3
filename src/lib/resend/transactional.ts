import { Resend } from 'resend';
import { buildBookingConfirmationHtml } from './templates/BookingConfirmationEmail';
import { buildPaymentReceiptHtml }      from './templates/PaymentReceiptEmail';
import { buildEventReminderHtml }       from './templates/EventReminderEmail';
import { buildRSVPConfirmationHtml }    from './templates/RSVPConfirmationEmail';
import { buildVendorWelcomeHtml }       from './templates/VendorWelcomeEmail';

const FROM   = process.env.RESEND_FROM_EMAIL ?? 'noreply@eventnest.in';

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key || key.startsWith('your_')) {
    throw new Error('RESEND_API_KEY is not configured.');
  }
  return new Resend(key);
}

// ── Booking Confirmation ──────────────────────────────────────────────────────

interface BookingConfirmationParams {
  to:          string;
  vendorName:  string;
  hostName:    string;
  bookingRef:  string;
  serviceDate: string;
  amount:      number;
}

export async function sendBookingConfirmationEmail(
  params: BookingConfirmationParams,
): Promise<void> {
  await getResend().emails.send({
    from:    FROM,
    to:      params.to,
    subject: `Booking Confirmed — ${params.bookingRef} | Milap`,
    html:    buildBookingConfirmationHtml(params),
  });
}

// ── Payment Receipt ───────────────────────────────────────────────────────────

interface PaymentReceiptParams {
  to:         string;
  guestName:  string;
  amount:     number;
  bookingRef: string;
  vendorName: string;
  paymentId:  string;
}

export async function sendPaymentReceiptEmail(
  params: PaymentReceiptParams,
): Promise<void> {
  await getResend().emails.send({
    from:    FROM,
    to:      params.to,
    subject: `Payment Receipt — ${params.bookingRef} | Milap`,
    html:    buildPaymentReceiptHtml(params),
  });
}

// ── Event Reminder ────────────────────────────────────────────────────────────

interface EventReminderParams {
  to:         string;
  guestName:  string;
  eventTitle: string;
  eventDate:  string;
  eventTime?: string;
  venueName?: string;
  venueCity?: string;
  rsvpUrl:    string;
}

export async function sendEventReminderEmail(
  params: EventReminderParams,
): Promise<void> {
  await getResend().emails.send({
    from:    FROM,
    to:      params.to,
    subject: `Reminder: ${params.eventTitle} is Tomorrow! | Milap`,
    html:    buildEventReminderHtml(params),
  });
}

// ── RSVP Confirmation ─────────────────────────────────────────────────────────

interface RSVPConfirmationParams {
  to:         string;
  guestName:  string;
  eventTitle: string;
  eventDate:  string;
  rsvpStatus: 'confirmed' | 'declined' | 'maybe';
  rsvpUrl:    string;
}

export async function sendRSVPConfirmationEmail(
  params: RSVPConfirmationParams,
): Promise<void> {
  await getResend().emails.send({
    from:    FROM,
    to:      params.to,
    subject: `RSVP ${params.rsvpStatus === 'confirmed' ? 'Confirmed' : 'Received'} — ${params.eventTitle} | Milap`,
    html:    buildRSVPConfirmationHtml(params),
  });
}

// ── Vendor Welcome ────────────────────────────────────────────────────────────

interface VendorWelcomeParams {
  to:           string;
  vendorName:   string;
  businessName: string;
  profileUrl:   string;
}

export async function sendVendorWelcomeEmail(
  params: VendorWelcomeParams,
): Promise<void> {
  await getResend().emails.send({
    from:    FROM,
    to:      params.to,
    subject: `Welcome to Milap Vendor Marketplace, ${params.businessName}!`,
    html:    buildVendorWelcomeHtml(params),
  });
}
