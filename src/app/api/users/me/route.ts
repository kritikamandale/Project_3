import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, users } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';

const UpdateProfileSchema = z.object({
  name:  z.string().min(2).max(100).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number').optional(),
  city:  z.string().max(100).optional(),
});

export async function PATCH(req: NextRequest) {
  const jar = await cookies();
  const token = jar.get('milap_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let user;
  try { user = await verifyAccessToken(token); }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }); }

  const parsed = UpdateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name  !== undefined) updates.fullName = parsed.data.name;
  if (parsed.data.email !== undefined) updates.email    = parsed.data.email;
  if (parsed.data.phone !== undefined) updates.phone    = parsed.data.phone;
  if (parsed.data.city  !== undefined) updates.city     = parsed.data.city;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }
  updates.updatedAt = new Date();

  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, user.sub))
    .returning({
      id:       users.id,
      email:    users.email,
      fullName: users.fullName,
      phone:    users.phone,
      city:     users.city,
      role:     users.role,
      avatarUrl: users.avatarUrl,
    });

  return NextResponse.json({
    user: {
      id:       updated.id,
      email:    updated.email,
      name:     updated.fullName,
      phone:    updated.phone,
      city:     updated.city,
      role:     updated.role,
      avatar:   updated.avatarUrl,
    },
  });
}
