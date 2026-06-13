// Pichwai-themed RSVP confirmation email — returns HTML string

interface Params {
  guestName:  string;
  eventTitle: string;
  eventDate:  string;
  rsvpStatus: 'confirmed' | 'declined' | 'maybe';
  rsvpUrl:    string;
}

const STATUS_CONFIG = {
  confirmed: { emoji: '🎉', label: 'Confirmed!',      color: '#2E7D32', bg: '#E8F5E9', message: "We're thrilled you'll be joining us!" },
  declined:  { emoji: '😢', label: 'Declined',         color: '#C62828', bg: '#FFEBEE', message: "We're sorry you won't be able to make it. Hope to see you next time!" },
  maybe:     { emoji: '🤔', label: 'Maybe Attending',  color: '#E65100', bg: '#FFF3E0', message: "Let us know when you've decided — we'd love to have you!" },
};

export function buildRSVPConfirmationHtml(p: Params): string {
  const cfg    = STATUS_CONFIG[p.rsvpStatus];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://eventnest.in';

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>RSVP ${cfg.label}</title></head>
<body style="margin:0;padding:0;background:#FFF8F0;font-family:'Georgia',serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8F0;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0"
  style="max-width:560px;width:100%;background:#FFFDF8;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(62,32,0,0.10);">

  <!-- Header -->
  <tr><td align="center" style="background:linear-gradient(135deg,#3E2000,#6B3A1F);padding:24px 32px;">
    <p style="color:#C9933A;font-size:11px;letter-spacing:4px;text-transform:uppercase;margin:0 0 4px;font-weight:400;">EventNest</p>
    <h1 style="color:#FFFDF8;font-size:24px;margin:0;">RSVP Update</h1>
  </td></tr>

  <!-- Status badge -->
  <tr><td align="center" style="padding:28px 32px 16px;">
    <div style="display:inline-block;background:${cfg.bg};border:1px solid ${cfg.color}33;border-radius:50px;padding:10px 24px;margin-bottom:16px;">
      <span style="color:${cfg.color};font-size:15px;font-weight:700;">${cfg.emoji} &nbsp;${cfg.label}</span>
    </div>
    <p style="color:#3E2000;font-size:16px;margin:0;">Hi <strong>${p.guestName}</strong>,</p>
    <p style="color:#6B3A1F;font-size:15px;margin:8px 0 0;">${cfg.message}</p>
  </td></tr>

  <!-- Event details -->
  <tr><td style="padding:0 32px 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
      style="border:1px solid #C9933A;border-radius:12px;background:#FFF8F0;">
      <tr><td style="padding:16px 20px;">
        <h3 style="font-size:18px;color:#3E2000;margin:0 0 8px;">${p.eventTitle}</h3>
        <p style="color:#8B6914;font-size:13px;margin:0;">📅 ${p.eventDate}</p>
      </td></tr>
    </table>
  </td></tr>

  ${p.rsvpStatus !== 'confirmed' ? '' : `
  <!-- Confirmed extra info -->
  <tr><td style="padding:0 32px 16px;">
    <p style="color:#6B3A1F;font-size:13px;margin:0;">
      A reminder will be sent 24 hours before the event. You can update your RSVP anytime using the link below.
    </p>
  </td></tr>`}

  <!-- CTA -->
  <tr><td align="center" style="padding:0 32px 32px;">
    <a href="${p.rsvpUrl}"
      style="display:inline-block;padding:13px 36px;background:linear-gradient(135deg,#C9933A,#F4A825);color:#fff;font-weight:bold;text-decoration:none;border-radius:50px;font-size:14px;">
      ${p.rsvpStatus === 'maybe' ? 'Update Your RSVP' : 'View Event Details'}
    </a>
  </td></tr>

  <!-- Footer -->
  <tr><td align="center" style="border-top:1px solid #F4E4C1;padding:16px 32px;">
    <p style="color:#8B6914;font-size:11px;margin:0;">
      Sent via <strong style="color:#C9933A;">EventNest</strong> — India's Smart Event Platform
    </p>
  </td></tr>
  <tr><td style="background:linear-gradient(135deg,#C9933A,#F4A825);height:5px;"/></tr>
</table></td></tr></table>
</body></html>`;
}
