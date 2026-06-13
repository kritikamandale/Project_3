export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  HOST: 'host',
  VENDOR: 'vendor',
  GUEST: 'guest',
} as const;

export type RoleValue = (typeof ROLES)[keyof typeof ROLES];

export const PERMISSIONS = {
  // Event permissions
  'event:create':      [ROLES.HOST, ROLES.SUPER_ADMIN],
  'event:read:own':    [ROLES.HOST, ROLES.SUPER_ADMIN],
  'event:read:all':    [ROLES.SUPER_ADMIN],
  'event:update:own':  [ROLES.HOST, ROLES.SUPER_ADMIN],
  'event:delete:own':  [ROLES.HOST, ROLES.SUPER_ADMIN],
  // Guest permissions
  'guest:manage':      [ROLES.HOST, ROLES.SUPER_ADMIN],
  'guest:checkin':     [ROLES.HOST, ROLES.SUPER_ADMIN],
  'guest:rsvp':        [ROLES.GUEST, ROLES.HOST],
  // Vendor permissions
  'vendor:list':       [ROLES.HOST, ROLES.SUPER_ADMIN, ROLES.VENDOR],
  'vendor:manage:own': [ROLES.VENDOR, ROLES.SUPER_ADMIN],
  'vendor:verify':     [ROLES.SUPER_ADMIN],
  'vendor:feature':    [ROLES.SUPER_ADMIN],
  // Payment permissions
  'payment:create':    [ROLES.HOST, ROLES.SUPER_ADMIN],
  'payment:read:own':  [ROLES.HOST, ROLES.VENDOR, ROLES.SUPER_ADMIN],
  'payment:refund':    [ROLES.SUPER_ADMIN],
  // Admin permissions
  'admin:users':       [ROLES.SUPER_ADMIN],
  'admin:analytics':   [ROLES.SUPER_ADMIN],
  'admin:settings':    [ROLES.SUPER_ADMIN],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(userRole: string, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly string[]).includes(userRole);
}

export function requireRole(userRole: string, ...allowedRoles: RoleValue[]): boolean {
  return (allowedRoles as string[]).includes(userRole);
}
