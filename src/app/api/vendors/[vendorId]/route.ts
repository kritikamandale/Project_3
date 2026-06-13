import { type NextRequest } from 'next/server';
import { eq, and, desc } from 'drizzle-orm';
import { db, vendors, vendorReviews, users } from '@/lib/db';
import { cacheDel } from '@/lib/redis/client';
import { upsertVendorEmbedding } from '@/lib/pinecone/embeddings';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';
import type { Vendor } from '@/types/vendor.types';

async function getAuthUser() {
  const jar = await cookies();
  const token = jar.get('eventnest_session')?.value;
  if (!token) return null;
  try { return await verifyAccessToken(token); } catch { return null; }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> },
) {
  const { vendorId } = await params;

  const isUuid = /^[0-9a-f-]{36}$/.test(vendorId);
  const condition = isUuid
    ? eq(vendors.id, vendorId)
    : eq(vendors.slug, vendorId);

  const [vendor] = await db
    .select()
    .from(vendors)
    .where(and(condition, eq(vendors.isActive, true)));

  if (!vendor) {
    return Response.json({ error: 'Vendor not found' }, { status: 404 });
  }

  const reviews = await db
    .select({
      id:               vendorReviews.id,
      rating:           vendorReviews.rating,
      title:            vendorReviews.title,
      reviewText:       vendorReviews.reviewText,
      isVerifiedBooking:vendorReviews.isVerifiedBooking,
      vendorResponse:   vendorReviews.vendorResponse,
      createdAt:        vendorReviews.createdAt,
      reviewerName:     users.fullName,
      reviewerAvatar:   users.avatarUrl,
    })
    .from(vendorReviews)
    .leftJoin(users, eq(vendorReviews.reviewerId, users.id))
    .where(
      and(
        eq(vendorReviews.vendorId, vendor.id),
        eq(vendorReviews.isPublished, true),
      ),
    )
    .orderBy(desc(vendorReviews.createdAt))
    .limit(20);

  return Response.json({ vendor, reviews });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> },
) {
  const { vendorId } = await params;
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const [existing] = await db
    .select({ id: vendors.id, userId: vendors.userId })
    .from(vendors)
    .where(eq(vendors.id, vendorId));

  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });
  if (existing.userId !== user.sub && user.role !== 'super_admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json() as Record<string, unknown>;
  // Strip fields that must not be overwritten
  delete body.id;
  delete body.userId;
  delete body.slug;
  delete body.createdAt;

  const [updated] = await db
    .update(vendors)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(vendors.id, vendorId))
    .returning();

  await cacheDel('vendors:*');

  if (updated) {
    upsertVendorEmbedding(updated as unknown as Vendor).catch(() => null);
  }

  return Response.json({ vendor: updated });
}
