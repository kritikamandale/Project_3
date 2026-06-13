import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { anthropic as aiProvider } from '@ai-sdk/anthropic';
import { eq, and, gte, count } from 'drizzle-orm';
import { z } from 'zod/v4';
import { db, aiChatHistory, events, bookings, vendors, guests } from '@/lib/db';
import { SYSTEM_PROMPT } from '@/lib/anthropic/client';
import { searchSimilarVendors } from '@/lib/pinecone/embeddings';

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(4000),
});

const BodySchema = z.object({
  messages: z.array(MessageSchema).min(1).max(50),
  eventId:  z.string().uuid().optional(),
});

function getUser(req: NextRequest) {
  const id   = req.headers.get('x-user-id');
  const plan = req.headers.get('x-user-plan') ?? 'free';
  if (!id) return null;
  return { id, plan };
}

async function checkDailyLimit(userId: string, plan: string): Promise<boolean> {
  const limit = plan === 'free' ? 20 : 100;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [row] = await db
    .select({ total: count() })
    .from(aiChatHistory)
    .where(
      and(
        eq(aiChatHistory.userId, userId),
        eq(aiChatHistory.role, 'user'),
        gte(aiChatHistory.createdAt, startOfDay)
      )
    );

  return (row?.total ?? 0) < limit;
}

async function buildEventContext(eventId: string, userId: string): Promise<string> {
  const [ev] = await db
    .select({
      title:          events.title,
      eventType:      events.eventType,
      eventDate:      events.eventDate,
      venueCity:      events.venueCity,
      venueState:     events.venueState,
      expectedGuests: events.expectedGuests,
      confirmedGuests:events.confirmedGuests,
      totalBudget:    events.totalBudget,
      spentBudget:    events.spentBudget,
      theme:          events.theme,
    })
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.hostId, userId)))
    .limit(1);

  if (!ev) return '';

  const bookedVendors = await db
    .select({ businessName: vendors.businessName, category: vendors.category })
    .from(bookings)
    .innerJoin(vendors, eq(bookings.vendorId, vendors.id))
    .where(eq(bookings.eventId, eventId))
    .limit(10);

  const [guestCount] = await db
    .select({ total: count() })
    .from(guests)
    .where(eq(guests.eventId, eventId));

  const remainingBudget =
    Number(ev.totalBudget) - Number(ev.spentBudget);

  let ctx = `\n\n--- CURRENT EVENT CONTEXT ---`;
  ctx += `\nEvent: ${ev.title} (${ev.eventType})`;
  ctx += `\nDate: ${ev.eventDate}`;
  if (ev.venueCity) ctx += ` | City: ${ev.venueCity}, ${ev.venueState ?? ''}`;
  ctx += `\nGuests: ${guestCount?.total ?? 0} invited, ${ev.confirmedGuests} confirmed (expected: ${ev.expectedGuests})`;
  ctx += `\nBudget: ₹${Number(ev.totalBudget).toLocaleString('en-IN')} total, ₹${remainingBudget.toLocaleString('en-IN')} remaining`;
  if (ev.theme) ctx += `\nTheme: ${ev.theme}`;
  if (bookedVendors.length) {
    ctx += `\nBooked Vendors: ${bookedVendors.map((v) => `${v.businessName} (${v.category})`).join(', ')}`;
  }
  ctx += `\n--- END EVENT CONTEXT ---`;
  return ctx;
}

async function buildVendorContext(
  userMessage: string,
  eventContext: string,
): Promise<string> {
  const vendorIds = await searchSimilarVendors(userMessage + ' ' + eventContext);
  if (!vendorIds.length) return '';

  const vendorRows = await db
    .select({
      businessName: vendors.businessName,
      category:     vendors.category,
      city:         vendors.city,
      priceFrom:    vendors.priceStartingFrom,
      rating:       vendors.averageRating,
      tagline:      vendors.tagline,
    })
    .from(vendors)
    .where(eq(vendors.isActive, true))
    .limit(5);

  if (!vendorRows.length) return '';

  let ctx = `\n\n--- AVAILABLE VENDORS (from search) ---`;
  for (const v of vendorRows) {
    ctx += `\n• ${v.businessName} | ${v.category} | ${v.city}`;
    if (v.tagline) ctx += ` | "${v.tagline}"`;
    if (v.priceFrom) ctx += ` | From ₹${Number(v.priceFrom).toLocaleString('en-IN')}`;
    if (v.rating) ctx += ` | ⭐ ${v.rating}`;
  }
  ctx += `\n--- END VENDORS ---`;
  return ctx;
}

export async function POST(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 });
  }

  const { messages, eventId } = parsed.data;

  const withinLimit = await checkDailyLimit(user.id, user.plan);
  if (!withinLimit) {
    return NextResponse.json(
      { error: 'Daily message limit reached. Upgrade to premium for unlimited messages.' },
      { status: 429 }
    );
  }

  const lastUserMessage = messages.filter((m) => m.role === 'user').at(-1)?.content ?? '';

  const [eventContext, vendorContext] = await Promise.all([
    eventId ? buildEventContext(eventId, user.id) : Promise.resolve(''),
    buildVendorContext(lastUserMessage, '').catch(() => ''),
  ]);

  const fullSystem = SYSTEM_PROMPT + eventContext + vendorContext;

  const modelMessages = messages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  const result = streamText({
    model: aiProvider('claude-sonnet-4-6'),
    system: fullSystem,
    messages: modelMessages,
    maxOutputTokens: 1000,
    temperature: 0.7,
    onFinish: async ({ text, totalUsage }) => {
      try {
        const userMsg = messages.at(-1);
        const rows = [
          ...(userMsg?.role === 'user'
            ? [{
                userId:    user.id,
                eventId:   eventId ?? null,
                role:      'user' as const,
                content:   userMsg.content,
                model:     'claude-sonnet-4-6',
                tokens:    totalUsage?.inputTokens ?? null,
                metadata:  {} as Record<string, unknown>,
              }]
            : []),
          {
            userId:   user.id,
            eventId:  eventId ?? null,
            role:     'assistant' as const,
            content:  text,
            model:    'claude-sonnet-4-6',
            tokens:   totalUsage?.outputTokens ?? null,
            metadata: {} as Record<string, unknown>,
          },
        ];
        await db.insert(aiChatHistory).values(rows);
      } catch (err) {
        console.error('[AI Chat] Failed to save history:', err);
      }
    },
  });

  return result.toTextStreamResponse();
}
