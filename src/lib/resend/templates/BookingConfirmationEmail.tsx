// Pichwai-themed booking confirmation email — returns HTML string

interface Params {
  vendorName:  string;
  hostName:    string;
  bookingRef:  string;
  serviceDate: string;
  amount:      number;
}

export function buildBookingConfirmationHtml(p: Params): string {
  const amountStr = `₹${p.amount.toLocaleString('en-IN')}`;
  const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://eventnest.in';

  const lotusSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 60" width="160" height="60">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#C9933A"/><stop offset="100%" stop-color="#F4A825"/>
    </linearGradient></defs>
    <ellipse cx="80" cy="42" rx="14" ry="25" fill="url(#g)" transform="rotate(-35,80,42)" opacity="0.9"/>
    <ellipse cx="80" cy="42" rx="14" ry="25" fill="url(#g)" transform="rotate(-17,80,42)" opacity="0.9"/>
    <ellipse cx="80" cy="42" rx="14" ry="25" fill="url(#g)" opacity="0.9"/>
    <ellipse cx="80" cy="42" rx="14" ry="25" fill="url(#g)" transform="rotate(17,80,42)" opacity="0.9"/>
    <ellipse cx="80" cy="42" rx="14" ry="25" fill="url(#g)" transform="rotate(35,80,42)" opacity="0.9"/>
    <circle cx="80" cy="40" r="7" fill="#C9933A"/>
  </svg>`;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Booking Confirmed</title></head>
<body style="margin:0;padding:0;background:#FFF8F0;font-family:'Georgia',serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8F0;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFDF8;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(62,32,0,0.10);">

  <!-- Header -->
  <tr><td align="center" style="background:linear-gradient(135deg,#3E2000,#6B3A1F);padding:24px;">
    <div>${lotusSvg}</div>
    <h1 style="color:#C9933A;font-size:12px;letter-spacing:4px;text-transform:uppercase;margin:8px 0 0;font-weight:400;">EventNest</h1>
  </td></tr>

  <!-- Title -->
  <tr><td align="center" style="padding:32px 32px 16px;">
    <div style="display:inline-block;background:#E8F5E9;border-radius:50px;padding:8px 20px;margin-bottom:16px;">
      <span style="color:#2E7D32;font-size:13px;font-weight:600;">✓ &nbsp;Booking Confirmed</span>
    </div>
    <h2 style="font-size:26px;color:#3E2000;margin:0;">Your booking is confirmed!</h2>
    <p style="color:#6B3A1F;margin:8px 0 0;">Hi <strong>${p.vendorName}</strong>, here are the details.</p>
  </td></tr>

  <!-- Details -->
  <tr><td style="padding:0 32px 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
      style="border:2px solid #C9933A;border-radius:12px;overflow:hidden;">
      ${[
        ['Booking Reference', `<strong>${p.bookingRef}</strong>`],
        ['Host Name',         p.hostName],
        ['Service Date',      new Date(p.serviceDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })],
        ['Advance Paid',      `<strong style="color:#2E7D32;">${amountStr}</strong>`],
      ].map(([label, value], i) => `
      <tr style="background:${i % 2 === 0 ? '#FFFDF8' : '#FFF8F0'};">
        <td style="padding:12px 20px;color:#8B6914;font-size:13px;width:45%;">${label}</td>
        <td style="padding:12px 20px;color:#3E2000;font-size:14px;">${value}</td>
      </tr>`).join('')}
    </table>
  </td></tr>

  <!-- CTA -->
  <tr><td align="center" style="padding:0 32px 32px;">
    <a href="${appUrl}/vendor/bookings"
      style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#C9933A,#F4A825);color:#fff;font-weight:bold;text-decoration:none;border-radius:50px;font-size:15px;box-shadow:0 4px 16px rgba(201,147,58,0.35);">
      View Booking
    </a>
  </td></tr>

  <!-- Footer -->
  <tr><td align="center" style="border-top:1px solid #F4E4C1;padding:20px 32px;">
    <p style="color:#8B6914;font-size:11px;margin:0;">
      Sent via <strong style="color:#C9933A;">EventNest</strong> — India's Smart Event Platform
    </p>
  </td></tr>
  <tr><td style="background:linear-gradient(135deg,#C9933A,#F4A825);height:5px;"/></tr>
</table></td></tr></table>
</body></html>`;
}
