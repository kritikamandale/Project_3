import { NextRequest, NextResponse } from 'next/server';
import { eq, inArray } from 'drizzle-orm';
import { z } from 'zod/v4';
import { generateText } from 'ai';
import { db, vendors } from '@/lib/db';
import { groq, GROQ_MODEL, SYSTEM_PROMPT } from '@/lib/groq/client';
import { searchSimilarVendors } from '@/lib/pinecone/embeddings';

const BodySchema = z.object({
  query:      z.string().min(3).max(500),
  eventType:  z.string().optional(),
  city:       z.string().optional(),
  budget:     z.number().optional(),
  guestCount: z.number().optional(),
});

function getUser(req: NextRequest) {
  const id = req.headers.get('x-user-id');
  return id ? { id } : null;
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
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { query, eventType, city, budget, guestCount } = parsed.data;

  // Step 1: Semantic search via Pinecone
  const enrichedQuery = [
    query,
    eventType && `for ${eventType}`,
    city && `in ${city}`,
    budget && `budget ₹${budget.toLocaleString('en-IN')}`,
    guestCount && `${guestCount} guests`,
  ]
    .filter(Boolean)
    .join(' ');

  const vendorIds = await searchSimilarVendors(enrichedQuery, {
    ...(city ? { city } : {}),
  });

  // Step 2: Fetch full vendor details from DB
  const vendorRows =
    vendorIds.length > 0
      ? await db
          .select({
            id:           vendors.id,
            businessName: vendors.businessName,
            slug:         vendors.slug,
            category:     vendors.category,
            city:         vendors.city,
            state:        vendors.state,
            tagline:      vendors.tagline,
            description:  vendors.description,
            priceFrom:    vendors.priceStartingFrom,
            priceMax:     vendors.priceRangeMax,
            rating:       vendors.averageRating,
            totalReviews: vendors.totalReviews,
            isVerified:   vendors.isVerified,
            logoUrl:      vendors.logoUrl,
            phone:        vendors.phone,
          })
          .from(vendors)
          .where(inArray(vendors.id, vendorIds))
          .limit(10)
      : [];

  // Step 3: Format vendor context for AI recommendation
  const vendorContext =
    vendorRows.length > 0
      ? vendorRows
          .map(
            (v) =>
              `- ${v.businessName} (${v.category}, ${v.city}): ${v.tagline ?? v.description?.slice(0, 80) ?? ''} | From ₹${Number(v.priceFrom ?? 0).toLocaleString('en-IN')} | ⭐ ${v.rating}`,
          )
          .join('\n')
      : 'No vendors found for this query.';

  // Step 4: Generate personalised recommendation paragraph
  const prompt = [
    `The user is planning a ${eventType ?? 'event'}${city ? ` in ${city}` : ''}`,
    guestCount ? ` for ${guestCount} guests` : '',
    budget ? ` with a budget of ₹${budget.toLocaleString('en-IN')}` : '',
    '.',
    `\nTheir query: "${query}"`,
    `\n\nAvailable vendors:\n${vendorContext}`,
    '\n\nWrite a warm, helpful 2-3 sentence recommendation paragraph mentioning specific vendors by name.',
    'Focus on the most relevant ones. Do NOT invent vendors not listed above.',
  ].join('');

  const { text: recommendation } = await generateText({
    model: groq(GROQ_MODEL),
    system: SYSTEM_PROMPT,
    prompt: prompt,
  });

  return NextResponse.json({
    recommendations: recommendation,
    vendors: vendorRows.map((v) => ({
      id:           v.id,
      businessName: v.businessName,
      slug:         v.slug,
      category:     v.category,
      city:         v.city,
      state:        v.state,
      tagline:      v.tagline,
      priceFrom:    Number(v.priceFrom ?? 0),
      rating:       Number(v.rating ?? 0),
      totalReviews: v.totalReviews,
      isVerified:   v.isVerified,
      logoUrl:      v.logoUrl,
      phone:        v.phone,
    })),
  });
}
