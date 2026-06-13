import { type NextRequest } from 'next/server';
import { eq, and, asc, sql } from 'drizzle-orm';
import { db, budgetItems, events } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { z } from 'zod/v4';

async function getAuthUser() {
  const jar = await cookies();
  const token = jar.get('eventnest_session')?.value;
  if (!token) return null;
  try { return await verifyAccessToken(token); } catch { return null; }
}

async function assertEventOwner(eventId: string, userId: string) {
  const [event] = await db
    .select({ id: events.id })
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.hostId, userId)))
    .limit(1);
  return event ?? null;
}

const itemSchema = z.object({
  category:        z.string().min(1).max(100),
  itemName:        z.string().min(1).max(255),
  estimatedAmount: z.number().min(0),
  actualAmount:    z.number().min(0).optional(),
  isPaid:          z.boolean().optional(),
  vendorId:        z.string().uuid().optional(),
  bookingId:       z.string().uuid().optional(),
  notes:           z.string().optional(),
  receiptUrl:      z.string().url().optional(),
  dueDate:         z.string().optional(),
});

// ── GET /api/events/:eventId/budget ──────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { eventId } = await params;
  if (!await assertEventOwner(eventId, user.sub)) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const items = await db
    .select()
    .from(budgetItems)
    .where(eq(budgetItems.eventId, eventId))
    .orderBy(asc(budgetItems.category), asc(budgetItems.createdAt));

  return Response.json({ items });
}

// ── POST /api/events/:eventId/budget ─────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { eventId } = await params;
  if (!await assertEventOwner(eventId, user.sub)) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const parsed = itemSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 400 });
  }

  const [item] = await db
    .insert(budgetItems)
    .values({ eventId, ...parsed.data })
    .returning();

  await syncSpentBudget(eventId);

  return Response.json({ item }, { status: 201 });
}

// ── PATCH /api/events/:eventId/budget — update item (pass itemId in body) ────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { eventId } = await params;
  if (!await assertEventOwner(eventId, user.sub)) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json() as { itemId?: string } & Record<string, unknown>;
  if (!body.itemId) return Response.json({ error: 'itemId required' }, { status: 400 });
  const { itemId, ...rest } = body;

  const allowed = itemSchema.partial().safeParse(rest);
  if (!allowed.success) return Response.json({ error: allowed.error.issues }, { status: 400 });

  const [updated] = await db
    .update(budgetItems)
    .set({ ...allowed.data, updatedAt: new Date() })
    .where(and(eq(budgetItems.id, itemId), eq(budgetItems.eventId, eventId)))
    .returning();

  if (!updated) return Response.json({ error: 'Not found' }, { status: 404 });

  await syncSpentBudget(eventId);

  return Response.json({ item: updated });
}

// ── DELETE /api/events/:eventId/budget?itemId=xxx ─────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { eventId } = await params;
  if (!await assertEventOwner(eventId, user.sub)) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const itemId = req.nextUrl.searchParams.get('itemId');
  if (!itemId) return Response.json({ error: 'itemId query param required' }, { status: 400 });

  const [deleted] = await db
    .delete(budgetItems)
    .where(and(eq(budgetItems.id, itemId), eq(budgetItems.eventId, eventId)))
    .returning();

  if (!deleted) return Response.json({ error: 'Not found' }, { status: 404 });

  await syncSpentBudget(eventId);

  return Response.json({ success: true });
}

// ── Keep events.spent_budget in sync ─────────────────────────────────────────

async function syncSpentBudget(eventId: string) {
  await db
    .update(events)
    .set({
      spentBudget: sql<string>`(
        SELECT COALESCE(SUM(COALESCE(actual_amount, estimated_amount)), 0)
        FROM budget_items
        WHERE event_id = ${eventId}
      )`,
      updatedAt: new Date(),
    })
    .where(eq(events.id, eventId));
}
