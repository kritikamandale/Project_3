import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure:     true,
});

export { cloudinary };

export function memoriesFolder(eventId: string) {
  return `eventnest/events/${eventId}`;
}

export function vendorFolder(vendorId: string) {
  return `eventnest/vendors/${vendorId}`;
}

export function thumbnailUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    transformation: [
      { width: 300, height: 300, crop: 'thumb', gravity: 'auto' },
      { fetch_format: 'auto', quality: 'auto' },
    ],
  });
}
