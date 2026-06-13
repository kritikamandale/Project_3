import { NextRequest, NextResponse } from 'next/server';
import { eq, and, isNull, ilike, desc, asc, count, sql } from 'drizzle-orm';
import slugify from 'slugify';
import { nanoid } from 'nanoid';
import { db, events, auditLogs } from '@/lib/db';
import { hasPermission } from '@/lib/auth/permissions';
import {
  EventCreateSchema,
  EventListQuerySchema,
  type EventCreateInput,
} from '@/lib/validators/event.schema';
import {
  EVENT_TYPE_TEMPLATES,
  type ChecklistTemplateItem,
  type TimelineTemplateItem,
} from '@/lib/constants/eventTypes';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRequestUser(req: NextRequest) {
  const id    = req.headers.get('x-user-id');
  const role  = req.headers.get('x-user-role');
  const email = req.headers.get('x-user-email') ?? '';
  if (!id || !role) return null;
  return { id, role, email };
}

function err(msg: string, status: number) {
  return NextResponse.json({ error: msg }, { status });
}

async function writeAudit(params: {
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  newData?: unknown;
  success: boolean;
  errorMessage?: string;
  ipAddress?: string;
}) {
  try {
    await db.insert(auditLogs).values({
      userId:       params.userId,
      action:       params.action,
      resourceType: params.resourceType,
      resourceId:   params.resourceId,
      newData:      params.newData as Record<string, unknown>,
      success:      params.success,
      errorMessage: params.errorMessage,
      ipAddress:    params.ipAddress,
      metadata:     {},
    });
  } catch {
    // audit failures must never break the request
  }
}

// Build a unique URL-safe slug from the event title
async function buildSlug(title: string): Promise<string> {
  const base = slugify(title, { lower: true, strict: true, trim: true });
  return `${base}-${nanoid(6)}`;
}

// Hydrate template checklist items with absolute due dates
function hydrateChecklist(
  items: ChecklistTemplateItem[],
  eventDate: Date,
): Record<string, unknown>[] {
  return items.map((item) => {
    const due = new Date(eventDate);
    due.setDate(due.getDate() + item.dueOffsetDays);
    return {
      ...item,
      id:        nanoid(),
      dueDate:   due.toISOString().slice(0, 10),
      completed: false,
      sortOrder: 0,
    };
  });
}

function hydrateTimeline(
  items: TimelineTemplateItem[],
  eventDate: Date,
): Record<string, unknown>[] {
  return items.map((item) => {
    const due = new Date(eventDate);
    due.setDate(due.getDate() + item.dueOffsetDays);
    return { ...item, id: nanoid(), date: due.toISOString().slice(0, 10) };
  });
}

// ─── GET /api/events ──────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const user = getRequestUser(request);
  if (!user) return err('Unauthorized', 401);
  if (!hasPermission(user.role, 'event:read:own')) return err('Forbidden', 403);

  const { searchParams } = new URL(request.url);
  const parsed = EventListQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return err('Invalid query parameters', 400);

  const { page, limit, status, eventType, search, sortBy, sortOrder } = parsed.data;
  const offset = (page - 1) * limit;

  const filters = [
    eq(events.hostId, user.id),
    isNull(events.deletedAt),
    ...(status    ? [eq(events.status,    status    as typeof events.status._.data)]    : []),
    ...(eventType ? [eq(events.eventType, eventType as typeof events.eventType._.data)] : []),
    ...(search    ? [ilike(events.title, `%${search}%`)] : []),
  ];

  const orderCol =
    sortBy === 'title'     ? events.title     :
    sortBy === 'eventDate' ? events.eventDate :
    events.createdAt;

  const [rows, [{ total }]] = await Promise.all([
    db.select({
      id:            events.id,
      slug:          events.slug,
      title:         events.title,
      eventType:     events.eventType,
      status:        events.status,
      eventDate:     events.eventDate,
      eventTime:     events.eventTime,
      venueCity:     events.venueCity,
      expectedGuests:events.expectedGuests,
      confirmedGuests:events.confirmedGuests,
      totalBudget:   events.totalBudget,
      spentBudget:   events.spentBudget,
      coverImageUrl: events.coverImageUrl,
      isPrivate:     events.isPrivate,
      createdAt:     events.createdAt,
    })
      .from(events)
      .where(and(...filters))
      .orderBy(sortOrder === 'asc' ? asc(orderCol) : desc(orderCol))
      .limit(limit)
      .offset(offset),

    db.select({ total: count() })
      .from(events)
      .where(and(...filters)),
  ]);

  return NextResponse.json({
    events: rows,
    pagination: { page, limit, total: Number(total), totalPages: Math.ceil(Number(total) / limit) },
  });
}

// ─── POST /api/events ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const user = getRequestUser(request);
  if (!user) return err('Unauthorized', 401);
  if (!hasPermission(user.role, 'event:create')) return err('Forbidden', 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err('Invalid JSON body', 400);
  }

  const parsed = EventCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 422 });
  }

  const data: EventCreateInput = parsed.data;

  // Validate event date is in the future
  const eventDateObj = new Date(data.eventDate);
  if (isNaN(eventDateObj.getTime())) return err('Invalid event date', 422);

  const slug         = await buildSlug(data.title);
  const inviteToken  = nanoid(32);

  // Populate checklist and timeline from template
  const template     = EVENT_TYPE_TEMPLATES[data.eventType];
  const checklist    = template ? hydrateChecklist(template.defaultChecklist, eventDateObj) : [];
  const timeline     = template ? hydrateTimeline(template.defaultTimeline, eventDateObj) : [];

  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? request.headers.get('x-real-ip')
    ?? undefined;

  let created: typeof events.$inferSelect | null = null;

  try {
    const [row] = await db.insert(events).values({
      hostId:              user.id,
      slug,
      title:               data.title,
      description:         data.description,
      eventType:           data.eventType as typeof events.eventType._.data,
      status:              'draft',
      eventDate:           data.eventDate,
      eventTime:           data.eventTime,
      endDate:             data.endDate,
      endTime:             data.endTime,
      venueName:           data.venueName,
      venueAddress:        data.venueAddress,
      venueCity:           data.venueCity,
      venueState:          data.venueState,
      venuePincode:        data.venuePincode,
      venueGoogleMapsUrl:  data.venueGoogleMapsUrl,
      expectedGuests:      data.expectedGuests,
      totalBudget:         String(data.totalBudget),
      coverImageUrl:       data.coverImageUrl,
      theme:               data.theme,
      dresscode:           data.dresscode,
      specialInstructions: data.specialInstructions,
      isPrivate:           data.isPrivate,
      inviteToken,
      templateId:          data.templateId ?? data.eventType,
      checklist:           checklist as unknown[],
      timeline:            timeline  as unknown[],
      metadata:            { budgetCategories: data.budgetCategories ?? template?.defaultBudgetCategories ?? [] },
    }).returning();

    created = row;
  } catch (dbErr: unknown) {
    const msg = dbErr instanceof Error ? dbErr.message : 'Database error';
    await writeAudit({
      userId: user.id, action: 'event.create', resourceType: 'event',
      success: false, errorMessage: msg, ipAddress,
    });
    return err('Failed to create event', 500);
  }

  await writeAudit({
    userId: user.id, action: 'event.create', resourceType: 'event',
    resourceId: created!.id, newData: { title: created!.title, eventType: created!.eventType },
    success: true, ipAddress,
  });

  return NextResponse.json({ event: created }, { status: 201 });
}
