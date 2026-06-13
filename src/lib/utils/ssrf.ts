import { lookup } from 'dns/promises';

// ─── Allowlist of external domains we're permitted to fetch from ──────────────
const ALLOWED_DOMAINS = new Set([
  'res.cloudinary.com',
  'api.cloudinary.com',
  'api.razorpay.com',
  'checkout.razorpay.com',
  'lh3.googleusercontent.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
]);

// ─── Private / reserved IP ranges ────────────────────────────────────────────
const PRIVATE_RANGES: RegExp[] = [
  /^127\./,            // Loopback
  /^10\./,             // RFC 1918
  /^172\.(1[6-9]|2\d|3[01])\./,  // RFC 1918
  /^192\.168\./,       // RFC 1918
  /^169\.254\./,       // Link-local
  /^0\./,              // "This" network
  /^::1$/,             // IPv6 loopback
  /^fc00:/i,           // IPv6 unique local
  /^fe80:/i,           // IPv6 link-local
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,  // Shared address space (RFC 6598)
];

function isPrivateIp(ip: string): boolean {
  return PRIVATE_RANGES.some((re) => re.test(ip));
}

/**
 * Validates that a URL is safe to fetch:
 *   1. Must be HTTPS
 *   2. Hostname must be in ALLOWED_DOMAINS
 *   3. Resolved IP must not be a private/loopback address
 *
 * Returns the parsed URL on success; throws on failure.
 */
export async function validateExternalUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Invalid URL format');
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('Only HTTPS URLs are permitted');
  }

  if (!ALLOWED_DOMAINS.has(parsed.hostname)) {
    throw new Error(`Domain '${parsed.hostname}' is not in the permitted domain list`);
  }

  let resolvedIp: string;
  try {
    const result = await lookup(parsed.hostname, { family: 4 });
    resolvedIp = result.address;
  } catch {
    throw new Error(`Cannot resolve hostname '${parsed.hostname}'`);
  }

  if (isPrivateIp(resolvedIp)) {
    throw new Error('URL resolves to a private or reserved IP address — SSRF blocked');
  }

  return parsed;
}

/** Returns true when the URL's hostname is exactly Cloudinary's delivery domain. */
export function isCloudinaryUrl(url: string): boolean {
  try {
    return new URL(url).hostname === 'res.cloudinary.com';
  } catch {
    return false;
  }
}

/**
 * Validates that an uploaded image URL originates from our Cloudinary account.
 * Throws if it does not.
 */
export function assertCloudinaryUrl(url: string): void {
  if (!isCloudinaryUrl(url)) {
    throw new Error('Uploaded image URL must be from Cloudinary (res.cloudinary.com)');
  }
}
