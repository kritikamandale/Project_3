import { describe, it, expect } from '@jest/globals';
import { sanitizeHtml, sanitizeText, sanitizeInput, sanitizeFileName, escapeRegex } from '@/lib/utils/sanitize';

describe('sanitizeHtml', () => {
  it('allows safe tags', () => {
    const input  = '<b>bold</b> and <em>italic</em>';
    const result = sanitizeHtml(input);
    expect(result).toContain('<b>bold</b>');
    expect(result).toContain('<em>italic</em>');
  });

  it('strips <script> tags (XSS)', () => {
    const xss = '<script>alert("xss")</script><b>safe</b>';
    const result = sanitizeHtml(xss);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
    expect(result).toContain('<b>safe</b>');
  });

  it('strips event handlers (XSS via attribute)', () => {
    const xss = '<img src="x" onerror="alert(1)">';
    const result = sanitizeHtml(xss);
    expect(result).not.toContain('onerror');
    expect(result).not.toContain('alert');
  });

  it('strips javascript: href', () => {
    const xss = '<a href="javascript:void(0)">click</a>';
    const result = sanitizeHtml(xss);
    expect(result).not.toContain('javascript:');
  });

  it('strips <iframe> tags', () => {
    const html = '<iframe src="https://evil.com"></iframe>';
    expect(sanitizeHtml(html)).not.toContain('iframe');
  });
});

describe('sanitizeText', () => {
  it('removes all HTML tags', () => {
    const input = '<h1>Hello</h1><p>World</p>';
    expect(sanitizeText(input)).toBe('HelloWorld');
  });

  it('strips SQL injection attempt strings (as text — no special chars to escape)', () => {
    const sqlAttempt = "'; DROP TABLE users; --";
    const result = sanitizeText(sqlAttempt);
    // DOMPurify strips angle brackets but leaves SQL strings; ensure no HTML remains
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeText('')).toBe('');
  });
});

describe('sanitizeInput', () => {
  it('strips HTML tags and trims whitespace', () => {
    const input = '  <b>Hello</b> World  ';
    expect(sanitizeInput(input)).toBe('Hello World');
  });

  it('strips XSS payloads completely', () => {
    const xss = '<script>alert("pwned")</script>Username';
    const result = sanitizeInput(xss);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
    expect(result).toContain('Username');
  });

  it('normalizes unicode to NFC', () => {
    // 'é' can be represented as U+00E9 or U+0065 U+0301
    const nfd = 'é'; // NFD form
    expect(sanitizeInput(nfd)).toBe('é'); // NFC form
  });

  it('handles empty and whitespace-only strings', () => {
    expect(sanitizeInput('')).toBe('');
    expect(sanitizeInput('   ')).toBe('');
  });
});

describe('sanitizeFileName', () => {
  it('replaces forbidden characters with underscore', () => {
    expect(sanitizeFileName('my file!@#.jpg')).toBe('my_file_.jpg');
  });

  it('collapses consecutive underscores', () => {
    expect(sanitizeFileName('a???b.png')).toBe('a_b.png');
  });

  it('truncates to 255 characters', () => {
    const long = 'a'.repeat(300) + '.jpg';
    expect(sanitizeFileName(long).length).toBeLessThanOrEqual(255);
  });

  it('preserves dots and hyphens', () => {
    expect(sanitizeFileName('my-file.v2.tar.gz')).toBe('my-file.v2.tar.gz');
  });
});

describe('escapeRegex', () => {
  it('escapes regex special characters', () => {
    const pattern = 'price is $10.00 (approx)';
    const escaped = escapeRegex(pattern);
    // Should not throw when used in new RegExp()
    expect(() => new RegExp(escaped)).not.toThrow();
    expect(new RegExp(escaped).test(pattern)).toBe(true);
  });

  it('escapes a dot', () => {
    const escaped = escapeRegex('a.b');
    expect(escaped).toBe('a\\.b');
  });
});
