import { type NextRequest } from 'next/server';
import { db, vendors, vendorReviews } from '@/lib/db';
import { sql, and, gte, lte, like, or, desc, asc, eq, count } from 'drizzle-orm';
import { cacheGet, cacheSet, vendorCacheKey } from '@/lib/redis/client';

const PAGE_SIZE = 20;
const CACHE_TTL = 300; // 5 minutes

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const category  = searchParams.get('category') ?? undefined;
  const city      = searchParams.get('city') ?? undefined;
  const minPrice  = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPrice  = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const minRating = searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined;
  const search    = searchParams.get('search') ?? undefined;
  const verified  = searchParams.get('verified') === 'true';
  const cursor    = searchParams.get('cursor') ?? undefined;
  const limit     = Math.min(Number(searchParams.get('limit') ?? PAGE_SIZE), 50);
  const sortBy    = searchParams.get('sortBy') ?? 'relevance';

  const queryParams = { category, city, minPrice, maxPrice, minRating, search, verified, cursor, limit, sortBy };
  const cacheKey = vendorCacheKey(queryParams as Record<string, unknown>);

  const cached = await cacheGet(cacheKey);
  if (cached) {
    return Response.json(cached, {
      headers: { 'X-Cache': 'HIT', 'Cache-Control': 'public, s-maxage=60' },
    });
  }

  const conditions = [
    eq(vendors.isActive, true),
    eq(vendors.deletedAt, null as unknown as Date),
  ];

  if (category)  conditions.push(eq(vendors.category, category as never));
  if (city)      conditions.push(like(vendors.city, `%${city}%`));
  if (minPrice)  conditions.push(gte(vendors.priceStartingFrom, String(minPrice)));
  if (maxPrice)  conditions.push(lte(vendors.priceStartingFrom, String(maxPrice)));
  if (minRating) conditions.push(gte(vendors.averageRating, String(minRating)));
  if (verified)  conditions.push(eq(vendors.isVerified, 'verified'));

  if (search) {
    conditions.push(
      or(
        sql`${vendors.businessName} ILIKE ${'%' + search + '%'}`,
        sql`${vendors.description} ILIKE ${'%' + search + '%'}`,
        sql`${vendors.tagline} ILIKE ${'%' + search + '%'}`,
      )!,
    );
  }

  // Cursor-based pagination using createdAt + id
  if (cursor) {
    try {
      const [cursorDate, cursorId] = Buffer.from(cursor, 'base64url')
        .toString()
        .split('|');
      conditions.push(
        sql`(${vendors.createdAt}, ${vendors.id}) < (${cursorDate}::timestamptz, ${cursorId}::uuid)`,
      );
    } catch {
      // malformed cursor — ignore
    }
  }

  const where = and(...conditions);

  const orderClause = (() => {
    switch (sortBy) {
      case 'rating':    return [desc(vendors.averageRating), desc(vendors.totalReviews)];
      case 'priceAsc':  return [asc(vendors.priceStartingFrom)];
      case 'priceDesc': return [desc(vendors.priceStartingFrom)];
      case 'reviews':   return [desc(vendors.totalReviews)];
      default:          return [desc(vendors.isFeatured), desc(vendors.averageRating), desc(vendors.totalReviews)];
    }
  })();

  const rows = await db
    .select({
      id:                   vendors.id,
      slug:                 vendors.slug,
      businessName:         vendors.businessName,
      tagline:              vendors.tagline,
      category:             vendors.category,
      logoUrl:              vendors.logoUrl,
      coverImageUrl:        vendors.coverImageUrl,
      city:                 vendors.city,
      state:                vendors.state,
      priceStartingFrom:    vendors.priceStartingFrom,
      currency:             vendors.currency,
      averageRating:        vendors.averageRating,
      totalReviews:         vendors.totalReviews,
      isVerified:           vendors.isVerified,
      isFeatured:           vendors.isFeatured,
      responseTimeHours:    vendors.responseTimeHours,
      yearsExperience:      vendors.yearsExperience,
      totalEventsDone:      vendors.totalEventsDone,
      createdAt:            vendors.createdAt,
    })
    .from(vendors)
    .where(where)
    .orderBy(...orderClause)
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  const nextCursor = hasMore
    ? Buffer.from(`${items.at(-1)!.createdAt.toISOString()}|${items.at(-1)!.id}`).toString('base64url')
    : null;

  const [{ total }] = await db
    .select({ total: count() })
    .from(vendors)
    .where(and(...conditions.slice(0, conditions.length)));

  const payload = { items, total, nextCursor, hasMore };
  await cacheSet(cacheKey, payload, CACHE_TTL);

  return Response.json(payload, {
    headers: { 'X-Cache': 'MISS', 'Cache-Control': 'public, s-maxage=60' },
  });
}
