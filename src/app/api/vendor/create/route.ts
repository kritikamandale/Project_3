import { type NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod/v4';
import slugify from 'slugify';
import { nanoid } from 'nanoid';
import { db, vendors } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { upsertVendorEmbedding } from '@/lib/pinecone/embeddings';
import type { Vendor } from '@/types/vendor.types';

const CreateVendorSchema = z.object({
  businessName:     z.string().min(2).max(255),
  category:         z.string(),
  tagline:          z.string().max(255).optional(),
  description:      z.string().max(5000).optional(),
  city:             z.string().min(1),
  state:            z.string().min(1),
  phone:            z.string().min(7).max(15),
  whatsapp:         z.string().optional(),
  email:            z.string().email().optional(),
  websiteUrl:       z.string().url().optional().or(z.literal('')),
  instagramUrl:     z.string().optional(),
  priceStartingFrom:z.string().optional(),
  priceRangeMax:    z.string().optional(),
  pricePerUnit:     z.string().optional(),
  yearsExperience:  z.number().int().min(0).optional(),
  packages:         z.array(z.object({ name: z.string(), price: z.number(), inclusions: z.array(z.string()) })).optional(),
  faq:              z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
  metadata:         z.record(z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  const jar = await cookies();
  const token = jar.get('eventnest_session')?.value;
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let user;
  try { user = await verifyAccessToken(token); }
  catch { return Response.json({ error: 'Unauthorized' }, { status: 401 }); }

  if (user.role !== 'vendor' && user.role !== 'super_admin') {
    return Response.json({ error: 'Only vendor accounts can create a vendor profile' }, { status: 403 });
  }

  // One vendor profile per user
  const [existing] = await db.select({ id: vendors.id }).from(vendors).where(eq(vendors.userId, user.sub));
  if (existing) return Response.json({ error: 'Vendor profile already exists', vendorId: existing.id }, { status: 409 });

  const body = await req.json();
  const parsed = CreateVendorSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 422 });
  }

  const { businessName, ...rest } = parsed.data;

  // Generate unique slug
  const base = slugify(businessName, { lower: true, strict: true });
  const slug = `${base}-${nanoid(6)}`;

  const [vendor] = await db
    .insert(vendors)
    .values({
      userId:  user.sub,
      businessName,
      slug,
      category: rest.category as never,
      tagline:  rest.tagline ?? null,
      description: rest.description ?? null,
      city:     rest.city,
      state:    rest.state,
      phone:    rest.phone,
      whatsapp: rest.whatsapp ?? null,
      email:    rest.email ?? null,
      websiteUrl:    rest.websiteUrl || null,
      instagramUrl:  rest.instagramUrl ?? null,
      priceStartingFrom: rest.priceStartingFrom ?? null,
      priceRangeMax:     rest.priceRangeMax ?? null,
      pricePerUnit:      rest.pricePerUnit ?? null,
      yearsExperience:   rest.yearsExperience ?? 0,
      packages: (rest.packages ?? []) as unknown as never,
      faq:      (rest.faq ?? []) as unknown as never,
      metadata: (rest.metadata ?? {}) as never,
    })
    .returning();

  // Async — don't block response
  upsertVendorEmbedding(vendor as unknown as Vendor).catch(() => null);

  return Response.json({ vendor }, { status: 201 });
}
