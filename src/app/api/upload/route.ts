import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { cloudinary, memoriesFolder } from '@/lib/cloudinary/config';

const SignBodySchema = z.object({
  folder:        z.string().min(1).max(255),
  transformation: z.string().optional(),
  tags:          z.array(z.string()).optional(),
});

function getUser(req: NextRequest) {
  const id = req.headers.get('x-user-id');
  return id ? { id } : null;
}

// POST /api/upload
// Returns a Cloudinary signed upload payload for direct browser-to-Cloudinary uploads
export async function POST(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = SignBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { folder, transformation, tags } = parsed.data;

  const timestamp = Math.round(Date.now() / 1000);

  const params: Record<string, unknown> = {
    folder,
    timestamp,
    transformation: transformation ?? 'f_auto,q_auto',
  };
  if (tags?.length) params.tags = tags.join(',');

  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!,
  );

  return NextResponse.json({
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey:    process.env.CLOUDINARY_API_KEY,
    folder,
  });
}

// GET /api/upload?eventId=xxx — returns upload config for a specific event
export async function GET(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const eventId = url.searchParams.get('eventId');

  const folder = eventId ? memoriesFolder(eventId) : `eventnest/users/${user.id}`;
  const timestamp = Math.round(Date.now() / 1000);

  const params: Record<string, unknown> = {
    folder,
    timestamp,
    transformation: 'f_auto,q_auto',
  };

  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!,
  );

  return NextResponse.json({
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey:    process.env.CLOUDINARY_API_KEY,
    folder,
    uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
  });
}
