import { db } from '@/lib/db';
import { events, vendors } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

// ─── Domain errors ────────────────────────────────────────────────────────────

export class ForbiddenError extends Error {
  readonly code = 'FORBIDDEN';
  constructor(message = 'Access denied') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  readonly code = 'NOT_FOUND';
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

// ─── Ownership assertions ─────────────────────────────────────────────────────

/**
 * Throws 403 if userId is not the host of eventId.
 * Throws 404 if the event does not exist or is soft-deleted.
 * super_admin bypasses this check.
 */
export async function assertEventOwnership(
  eventId: string,
  userId: string,
  role?: string,
): Promise<void> {
  if (role === 'super_admin') return;

  const [event] = await db
    .select({ hostId: events.hostId })
    .from(events)
    .where(and(eq(events.id, eventId), isNull(events.deletedAt)))
    .limit(1);

  if (!event) throw new NotFoundError('Event not found');
  if (event.hostId !== userId) throw new ForbiddenError('You do not own this event');
}

/**
 * Throws 403 if userId does not own vendorId.
 * Throws 404 if the vendor does not exist or is soft-deleted.
 * super_admin bypasses this check.
 */
export async function assertVendorOwnership(
  vendorId: string,
  userId: string,
  role?: string,
): Promise<void> {
  if (role === 'super_admin') return;

  const [vendor] = await db
    .select({ userId: vendors.userId })
    .from(vendors)
    .where(and(eq(vendors.id, vendorId), isNull(vendors.deletedAt)))
    .limit(1);

  if (!vendor) throw new NotFoundError('Vendor profile not found');
  if (vendor.userId !== userId) throw new ForbiddenError('You do not own this vendor profile');
}

// ─── Role guards ──────────────────────────────────────────────────────────────

/** Throws 403 if role is not super_admin. */
export function requireSuperAdmin(role: string): void {
  if (role !== 'super_admin') throw new ForbiddenError('Super admin access required');
}

/** Throws 403 if the user does not have one of the allowed roles. */
export function requireRole(userRole: string, ...allowed: string[]): void {
  if (!allowed.includes(userRole)) {
    throw new ForbiddenError(`Role '${userRole}' is not permitted for this action`);
  }
}

// ─── Response helper ──────────────────────────────────────────────────────────

/** Maps ForbiddenError / NotFoundError to proper HTTP responses; re-throws anything else. */
export function ownershipErrorResponse(error: unknown): Response {
  if (error instanceof ForbiddenError) {
    return Response.json({ error: error.message, code: error.code }, { status: 403 });
  }
  if (error instanceof NotFoundError) {
    return Response.json({ error: error.message, code: error.code }, { status: 404 });
  }
  throw error;
}
