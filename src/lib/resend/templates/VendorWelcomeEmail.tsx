// Pichwai-themed vendor onboarding welcome email — returns HTML string

interface Params {
  vendorName:   string;
  businessName: string;
  profileUrl:   string;
}

const STEPS = [
  { emoji: '📸', title: 'Upload Photos',        desc: 'Add your logo, cover photo, and gallery to attract more hosts.' },
  { emoji: '💰', title: 'Set Your Packages',    desc: 'Define your service packages and pricing to get more inquiries.' },
  { emoji: '✅', title: 'Get Verified',          desc: 'Submit documents for verification to build trust with hosts.' },
  { emoji: '🎉', title: 'Start Accepting Bookings', desc: 'Once live, hosts across India can discover and book you.' },
];

export function buildVendorWelcomeHtml(p: Params): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://milap.in';

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Welcome to Milap Vendors</title></head>
<body style="margin:0;padding:0;background:#FFF8F0;font-family:'Georgia',serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8F0;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0"
  style="max-width:560px;width:100%;background:#FFFDF8;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(62,32,0,0.10);">

  <!-- Header -->
  <tr><td align="center" style="background:linear-gradient(135deg,#3E2000,#6B3A1F);padding:32px;">
    <p style="color:#C9933A;font-size:11px;letter-spacing:4px;text-transform:uppercase;margin:0 0 8px;font-weight:400;">Milap</p>
    <h1 style="color:#FFFDF8;font-size:28px;margin:0;">Welcome, ${p.businessName}! 🌸</h1>
    <p style="color:#F4E4C1;font-size:14px;margin:8px 0 0;">You're now part of India's premier event marketplace</p>
  </td></tr>

  <!-- Greeting -->
  <tr><td style="padding:28px 32px 16px;">
    <p style="color:#3E2000;font-size:16px;margin:0;">Hi <strong>${p.vendorName}</strong>,</p>
    <p style="color:#6B3A1F;font-size:15px;line-height:1.6;margin:12px 0 0;">
      Congratulations! Your vendor account on <strong>Milap</strong> is ready.
      Complete your profile to start appearing in search results and receive booking inquiries from thousands of event hosts.
    </p>
  </td></tr>

  <!-- Next steps -->
  <tr><td style="padding:0 32px 24px;">
    <p style="color:#8B6914;font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin:0 0 12px;">
      Get Started — 4 Simple Steps
    </p>
    ${STEPS.map((step, i) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
      <tr>
        <td style="width:44px;vertical-align:top;">
          <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#C9933A,#F4A825);display:flex;align-items:center;justify-content:center;text-align:center;line-height:36px;font-size:18px;">
            ${step.emoji}
          </div>
        </td>
        <td style="padding-left:12px;vertical-align:top;">
          <p style="color:#3E2000;font-size:14px;font-weight:600;margin:0;">${i + 1}. ${step.title}</p>
          <p style="color:#8B6914;font-size:13px;margin:2px 0 0;">${step.desc}</p>
        </td>
      </tr>
    </table>`).join('')}
  </td></tr>

  <!-- CTA -->
  <tr><td align="center" style="padding:0 32px 28px;">
    <a href="${p.profileUrl}"
      style="display:inline-block;padding:14px 48px;background:linear-gradient(135deg,#C9933A,#F4A825);color:#fff;font-weight:bold;text-decoration:none;border-radius:50px;font-size:16px;letter-spacing:0.5px;box-shadow:0 4px 16px rgba(201,147,58,0.35);">
      Complete My Profile →
    </a>
    <p style="color:#8B6914;font-size:12px;margin:12px 0 0;">Takes less than 10 minutes</p>
  </td></tr>

  <!-- Support -->
  <tr><td style="padding:0 32px 24px;">
    <div style="background:#F9F5E8;border-left:3px solid #C9933A;border-radius:8px;padding:14px 16px;">
      <p style="color:#3E2000;font-size:13px;margin:0;font-weight:600;">Need help getting started?</p>
      <p style="color:#8B6914;font-size:12px;margin:4px 0 0;">
        Email us at <a href="mailto:support@milap.in" style="color:#C9933A;">support@milap.in</a> or visit our help center.
      </p>
    </div>
  </td></tr>

  <!-- Footer -->
  <tr><td align="center" style="border-top:1px solid #F4E4C1;padding:16px 32px;">
    <p style="color:#8B6914;font-size:11px;margin:0;">
      <strong style="color:#C9933A;">Milap</strong> — India's Smart Event Platform<br/>
      <a href="${appUrl}/vendor/profile" style="color:#C9933A;text-decoration:none;">Manage Profile</a>
      &nbsp;·&nbsp;
      <a href="${appUrl}/help" style="color:#C9933A;text-decoration:none;">Help Center</a>
    </p>
  </td></tr>
  <tr><td style="background:linear-gradient(135deg,#C9933A,#F4A825);height:5px;"/></tr>
</table></td></tr></table>
</body></html>`;
}
