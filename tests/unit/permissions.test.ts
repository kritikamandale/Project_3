import { describe, it, expect } from '@jest/globals';
import { hasPermission, requireRole, PERMISSIONS, ROLES } from '@/lib/auth/permissions';

describe('hasPermission', () => {
  // ── Event permissions ──────────────────────────────────────────────────────
  it('host can create events', () => {
    expect(hasPermission('host', 'event:create')).toBe(true);
  });

  it('vendor cannot create events', () => {
    expect(hasPermission('vendor', 'event:create')).toBe(false);
  });

  it('guest cannot create events', () => {
    expect(hasPermission('guest', 'event:create')).toBe(false);
  });

  it('super_admin can create events', () => {
    expect(hasPermission('super_admin', 'event:create')).toBe(true);
  });

  it('super_admin can read all events', () => {
    expect(hasPermission('super_admin', 'event:read:all')).toBe(true);
  });

  it('host cannot read all events', () => {
    expect(hasPermission('host', 'event:read:all')).toBe(false);
  });

  // ── Guest permissions ──────────────────────────────────────────────────────
  it('host can manage guests', () => {
    expect(hasPermission('host', 'guest:manage')).toBe(true);
  });

  it('vendor cannot manage guests', () => {
    expect(hasPermission('vendor', 'guest:manage')).toBe(false);
  });

  it('guest can RSVP', () => {
    expect(hasPermission('guest', 'guest:rsvp')).toBe(true);
  });

  it('guest cannot check in other guests', () => {
    expect(hasPermission('guest', 'guest:checkin')).toBe(false);
  });

  // ── Vendor permissions ─────────────────────────────────────────────────────
  it('vendor can manage own profile', () => {
    expect(hasPermission('vendor', 'vendor:manage:own')).toBe(true);
  });

  it('host cannot manage vendor profile', () => {
    expect(hasPermission('host', 'vendor:manage:own')).toBe(false);
  });

  it('only super_admin can verify vendors', () => {
    expect(hasPermission('super_admin', 'vendor:verify')).toBe(true);
    expect(hasPermission('host', 'vendor:verify')).toBe(false);
    expect(hasPermission('vendor', 'vendor:verify')).toBe(false);
  });

  // ── Payment permissions ────────────────────────────────────────────────────
  it('host can create payments', () => {
    expect(hasPermission('host', 'payment:create')).toBe(true);
  });

  it('guest cannot create payments', () => {
    expect(hasPermission('guest', 'payment:create')).toBe(false);
  });

  it('only super_admin can issue refunds', () => {
    expect(hasPermission('super_admin', 'payment:refund')).toBe(true);
    expect(hasPermission('host', 'payment:refund')).toBe(false);
    expect(hasPermission('vendor', 'payment:refund')).toBe(false);
  });

  // ── Admin permissions ──────────────────────────────────────────────────────
  it('only super_admin has admin access', () => {
    const adminPerms: Array<keyof typeof PERMISSIONS> = ['admin:users', 'admin:analytics', 'admin:settings'];
    for (const perm of adminPerms) {
      expect(hasPermission('super_admin', perm)).toBe(true);
      expect(hasPermission('host', perm)).toBe(false);
      expect(hasPermission('vendor', perm)).toBe(false);
      expect(hasPermission('guest', perm)).toBe(false);
    }
  });
});

describe('requireRole', () => {
  it('returns true when role matches', () => {
    expect(requireRole('host', 'host', 'super_admin')).toBe(true);
    expect(requireRole('super_admin', 'host', 'super_admin')).toBe(true);
  });

  it('returns false when role does not match', () => {
    expect(requireRole('guest', 'host', 'vendor')).toBe(false);
    expect(requireRole('vendor', 'host')).toBe(false);
  });
});

describe('ROLES constants', () => {
  it('has all expected role values', () => {
    expect(ROLES.SUPER_ADMIN).toBe('super_admin');
    expect(ROLES.HOST).toBe('host');
    expect(ROLES.VENDOR).toBe('vendor');
    expect(ROLES.GUEST).toBe('guest');
  });
});
