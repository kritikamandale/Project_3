import { type NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod/v4';
import { db, vendorReviews, vendors } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';

async function getAuthUser() {
  const jar = await cookies();
  const token = jar.get('milap_session')?.value;
  if (!token) return null;
  try { return await verifyAccessToken(token); } catch { return null; }
}

const ReviewSchema = z.object({
  rating:     z.number().int().min(1).max(5),
  title:      z.string().max(255).optional(),
  reviewText: z.string().min(20).max(5000),
  bookingId:  z.string().uuid().optional(),
  eventId:    z.string().uuid().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> },
) {
  const { vendorId } = await params;
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = ReviewSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 422 });
  }

  const [vendor] = await db
    .select({ id: vendors.id })
    .from(vendors)
    .where(eq(vendors.id, vendorId));

  if (!vendor) return Response.json({ error: 'Vendor not found' }, { status: 404 });

  const { rating, title, reviewText, bookingId, eventId } = parsed.data;

  const isVerifiedBooking = !!bookingId;

  const [review] = await db
    .insert(vendorReviews)
    .values({
      vendorId,
      reviewerId: user.sub,
      eventId:    eventId ?? null,
      bookingId:  bookingId ?? null,
      rating,
      title:      title ?? null,
      reviewText: reviewText ?? null,
      isVerifiedBooking,
    })
    .returning();

  // Update vendor aggregate rating
  const allReviews = await db
    .select({ rating: vendorReviews.rating })
    .from(vendorReviews)
    .where(eq(vendorReviews.vendorId, vendorId));

  const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

  await db
    .update(vendors)
    .set({
      averageRating: String(avg.toFixed(2)),
      totalReviews:  allReviews.length,
      updatedAt:     new Date(),
    })
    .where(eq(vendors.id, vendorId));

  return Response.json({ review }, { status: 201 });
}
