// Pure HTML string generator for the Pichwai-themed invite email.
// Resend accepts html: string directly, so no @react-email dependency needed.

export interface InviteEmailParams {
  guestName: string;
  hostName: string;
  eventTitle: string;
  eventType: string;
  eventDate: string;
  eventTime?: string;
  venueName?: string;
  venueCity?: string;
  coverImageUrl?: string;
  rsvpUrl: string;
  personalMessage?: string;
}

export function buildInviteEmailHtml(params: InviteEmailParams): string {
  const {
    guestName,
    hostName,
    eventTitle,
    eventDate,
    eventTime,
    venueName,
    venueCity,
    coverImageUrl,
    rsvpUrl,
    personalMessage,
  } = params;

  const venueStr = [venueName, venueCity].filter(Boolean).join(', ');

  const lotusSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#C9933A"/>
        <stop offset="100%" stop-color="#F4A825"/>
      </linearGradient>
    </defs>
    <!-- Lotus petals -->
    <ellipse cx="100" cy="55" rx="18" ry="32" fill="url(#g)" transform="rotate(-40,100,55)" opacity="0.9"/>
    <ellipse cx="100" cy="55" rx="18" ry="32" fill="url(#g)" transform="rotate(-20,100,55)" opacity="0.9"/>
    <ellipse cx="100" cy="55" rx="18" ry="32" fill="url(#g)" opacity="0.9"/>
    <ellipse cx="100" cy="55" rx="18" ry="32" fill="url(#g)" transform="rotate(20,100,55)" opacity="0.9"/>
    <ellipse cx="100" cy="55" rx="18" ry="32" fill="url(#g)" transform="rotate(40,100,55)" opacity="0.9"/>
    <!-- Center -->
    <circle cx="100" cy="52" r="9" fill="#C9933A"/>
    <!-- Vines -->
    <path d="M20,70 Q50,50 80,65" stroke="#C9933A" stroke-width="1.5" fill="none" opacity="0.5"/>
    <path d="M180,70 Q150,50 120,65" stroke="#C9933A" stroke-width="1.5" fill="none" opacity="0.5"/>
  </svg>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>You're Invited!</title>
</head>
<body style="margin:0;padding:0;background:#FFF8F0;font-family:'Georgia',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8F0;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFDF8;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(62,32,0,0.10);">

          <!-- Lotus header banner -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#3E2000,#6B3A1F);padding:28px 24px 20px;">
              <div style="margin-bottom:8px;">${lotusSvg}</div>
              <h1 style="color:#C9933A;font-family:'Georgia',serif;font-size:13px;letter-spacing:4px;text-transform:uppercase;margin:0;font-weight:400;">
                Milap
              </h1>
            </td>
          </tr>

          ${coverImageUrl ? `
          <!-- Cover image -->
          <tr>
            <td style="padding:0;">
              <img src="${coverImageUrl}" alt="${eventTitle}" width="560" style="display:block;width:100%;max-height:220px;object-fit:cover;"/>
            </td>
          </tr>` : ''}

          <!-- "You're Invited" -->
          <tr>
            <td align="center" style="padding:32px 32px 0;">
              <p style="color:#C9933A;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px;">
                🌸 &nbsp; Personal Invitation &nbsp; 🌸
              </p>
              <h2 style="font-family:'Georgia',serif;font-size:30px;color:#3E2000;margin:0;line-height:1.2;">
                You're Invited!
              </h2>
              <p style="color:#8B6914;font-size:16px;margin:8px 0 0;">
                Dear <strong>${guestName}</strong>,
              </p>
            </td>
          </tr>

          <!-- Event details card -->
          <tr>
            <td style="padding:24px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                style="background:#FFFDF8;border:2px solid #C9933A;border-radius:12px;padding:4px;">
                <tr>
                  <td style="padding:20px;">
                    <h3 style="font-family:'Georgia',serif;font-size:22px;color:#3E2000;margin:0 0 16px;text-align:center;">
                      ${eventTitle}
                    </h3>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;border-bottom:1px solid #F4E4C1;">
                          <span style="color:#8B6914;font-size:13px;">📅 &nbsp;Date</span>
                          <span style="float:right;color:#3E2000;font-size:14px;font-weight:bold;">
                            ${eventDate}${eventTime ? ' · ' + eventTime : ''}
                          </span>
                        </td>
                      </tr>
                      ${venueStr ? `
                      <tr>
                        <td style="padding:6px 0;border-bottom:1px solid #F4E4C1;">
                          <span style="color:#8B6914;font-size:13px;">📍 &nbsp;Venue</span>
                          <span style="float:right;color:#3E2000;font-size:14px;font-weight:bold;">${venueStr}</span>
                        </td>
                      </tr>` : ''}
                      <tr>
                        <td style="padding:6px 0;">
                          <span style="color:#8B6914;font-size:13px;">👤 &nbsp;Hosted by</span>
                          <span style="float:right;color:#3E2000;font-size:14px;font-weight:bold;">${hostName}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${personalMessage ? `
          <!-- Personal message -->
          <tr>
            <td style="padding:0 32px 16px;">
              <p style="color:#6B3A1F;font-size:15px;font-style:italic;line-height:1.6;text-align:center;margin:0;border-left:3px solid #C9933A;padding-left:16px;">
                "${personalMessage}"
              </p>
            </td>
          </tr>` : ''}

          <!-- RSVP button -->
          <tr>
            <td align="center" style="padding:8px 32px 32px;">
              <a href="${rsvpUrl}"
                style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#C9933A,#F4A825);color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;border-radius:50px;letter-spacing:1px;box-shadow:0 4px 16px rgba(201,147,58,0.35);">
                🎉 &nbsp; RSVP Now
              </a>
              <p style="color:#8B6914;font-size:12px;margin:12px 0 0;">
                Click the button above to confirm your attendance
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 32px;">
              <hr style="border:none;border-top:1px solid #F4E4C1;margin:0;"/>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:20px 32px;">
              <p style="color:#8B6914;font-size:11px;margin:0;line-height:1.6;">
                This invitation was sent via <strong style="color:#C9933A;">Milap</strong> — India's Smart Event Platform<br/>
                If you believe this was sent in error, please ignore this email.
              </p>
            </td>
          </tr>

          <!-- Gold bottom strip -->
          <tr>
            <td style="background:linear-gradient(135deg,#C9933A,#F4A825);height:6px;"/>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
