// Pichwai-themed 24h event reminder email — returns HTML string

interface Params {
  guestName:  string;
  eventTitle: string;
  eventDate:  string;
  eventTime?: string;
  venueName?: string;
  venueCity?: string;
  rsvpUrl:    string;
}

export function buildEventReminderHtml(p: Params): string {
  const venueStr = [p.venueName, p.venueCity].filter(Boolean).join(', ');
  const timeStr  = p.eventTime ? ` at ${p.eventTime}` : '';

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Event Tomorrow!</title></head>
<body style="margin:0;padding:0;background:#FFF8F0;font-family:'Georgia',serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8F0;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0"
  style="max-width:560px;width:100%;background:#FFFDF8;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(62,32,0,0.10);">

  <!-- Header banner -->
  <tr><td align="center" style="background:linear-gradient(135deg,#6B3A1F,#C9933A);padding:24px 32px;">
    <p style="color:#F4E4C1;font-size:11px;letter-spacing:4px;text-transform:uppercase;margin:0 0 4px;">EventNest</p>
    <h1 style="color:#FFFDF8;font-size:26px;margin:0;">⏰ Happening Tomorrow!</h1>
  </td></tr>

  <!-- Greeting -->
  <tr><td style="padding:28px 32px 16px;">
    <p style="color:#3E2000;font-size:16px;margin:0;">Dear <strong>${p.guestName}</strong>,</p>
    <p style="color:#6B3A1F;font-size:15px;margin:12px 0 0;">
      Just a friendly reminder that <strong>${p.eventTitle}</strong> is happening <strong>tomorrow${timeStr}</strong>!
    </p>
  </td></tr>

  <!-- Event card -->
  <tr><td style="padding:0 32px 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
      style="border:2px solid #C9933A;border-radius:12px;background:#FFF8F0;">
      <tr><td style="padding:16px 20px;">
        <h2 style="font-size:20px;color:#3E2000;margin:0 0 12px;border-bottom:1px solid #F4E4C1;padding-bottom:10px;">
          🌸 ${p.eventTitle}
        </h2>
        <p style="color:#6B3A1F;font-size:14px;margin:6px 0;">📅 &nbsp;<strong>${p.eventDate}</strong>${timeStr}</p>
        ${venueStr ? `<p style="color:#6B3A1F;font-size:14px;margin:6px 0;">📍 &nbsp;<strong>${venueStr}</strong></p>` : ''}
      </td></tr>
    </table>
  </td></tr>

  <!-- Checklist -->
  <tr><td style="padding:0 32px 24px;">
    <p style="color:#8B6914;font-size:13px;font-weight:600;margin:0 0 8px;">Things to prepare:</p>
    ${['Check your outfit & accessories', 'Confirm your travel plans', 'Bring your invitation or show this email', 'Arrive 15 minutes early for the best experience'].map((item) =>
      `<p style="color:#6B3A1F;font-size:13px;margin:4px 0;">✓ &nbsp;${item}</p>`
    ).join('')}
  </td></tr>

  <!-- CTA -->
  <tr><td align="center" style="padding:0 32px 32px;">
    <a href="${p.rsvpUrl}"
      style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#C9933A,#F4A825);color:#fff;font-weight:bold;text-decoration:none;border-radius:50px;font-size:15px;">
      View Event Details
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
