import { NextRequest, NextResponse } from 'next/server';
import { cloudinary, memoriesFolder } from '@/lib/cloudinary/config';

const ALLOWED_FOLDER_PREFIXES = ['event-covers', 'eventnest/'];

function getUser(req: NextRequest) {
  const id = req.headers.get('x-user-id');
  return id ? { id } : null;
}

function isFolderAllowed(folder: string): boolean {
  return ALLOWED_FOLDER_PREFIXES.some((prefix) => folder.startsWith(prefix));
}

// POST /api/upload
// Accepts multipart/form-data with { file, folder } and uploads directly to Cloudinary.
// Returns { url } for use by the client.
export async function POST(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
  }

  const file   = formData.get('file');
  const folder = (formData.get('folder') as string | null) ?? 'event-covers';

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!isFolderAllowed(folder)) {
    return NextResponse.json({ error: 'Invalid upload folder' }, { status: 400 });
  }

  // Enforce max 10 MB per upload
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File exceeds 10 MB limit' }, { status: 413 });
  }

  const mimeType = file.type;
  if (!mimeType.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image files are allowed' }, { status: 415 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${mimeType};base64,${buffer.toString('base64')}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: 'image',
    transformation: [{ fetch_format: 'auto', quality: 'auto' }],
    tags: [`user:${user.id}`],
  });

  return NextResponse.json({ url: result.secure_url });
}

// GET /api/upload?eventId=xxx — returns a signed upload payload for direct browser-to-Cloudinary uploads
export async function GET(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const eventId = url.searchParams.get('eventId');

  const folder    = eventId ? memoriesFolder(eventId) : `eventnest/users/${user.id}`;
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
