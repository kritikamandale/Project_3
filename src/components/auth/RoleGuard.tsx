'use client';

import { type ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';
import { hasPermission, type Permission } from '@/lib/auth/permissions';
import type { UserRole } from '@/types/auth.types';

// ─── RoleGuard ────────────────────────────────────────────────────────────────

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Usage:
 *   <RoleGuard allowedRoles={['host', 'super_admin']} fallback={<Unauthorized />}>
 *     <ProtectedContent />
 *   </RoleGuard>
 */
export function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user);

  if (!user || !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// ─── PermissionGuard ─────────────────────────────────────────────────────────

interface PermissionGuardProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Usage:
 *   <PermissionGuard permission="event:create" fallback={null}>
 *     <CreateEventButton />
 *   </PermissionGuard>
 */
export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
  const user = useAuthStore((s) => s.user);

  if (!user || !hasPermission(user.role, permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// ─── usePermission hook ───────────────────────────────────────────────────────

/**
 * Usage:
 *   const canCreate = usePermission('event:create');
 */
export function usePermission(permission: Permission): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  return hasPermission(user.role, permission);
}

/**
 * Usage:
 *   const canAccessAdmin = useRole('super_admin');
 */
export function useRole(...roles: UserRole[]): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  return (roles as string[]).includes(user.role);
}
