import { getFcmAdmin } from './admin';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

interface PushMessage {
  title:    string;
  body:     string;
  data?:    Record<string, string>;
  imageUrl?: string;
}

async function getFcmToken(userId: string): Promise<string | null> {
  const [user] = await db
    .select({ metadata: users.metadata })
    .from(users)
    .where(eq(users.id, userId));

  const meta = user?.metadata as Record<string, unknown> | undefined;
  return typeof meta?.fcmToken === 'string' ? meta.fcmToken : null;
}

export async function sendPushToUser(
  userId:  string,
  message: PushMessage,
): Promise<boolean> {
  try {
    const token = await getFcmToken(userId);
    if (!token) return false;

    await getFcmAdmin().send({
      token,
      notification: {
        title:    message.title,
        body:     message.body,
        imageUrl: message.imageUrl,
      },
      data: message.data,
      android: {
        notification: { sound: 'default', priority: 'high' },
      },
      apns: {
        payload: { aps: { sound: 'default', badge: 1 } },
      },
      webpush: {
        notification: {
          icon:  '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
        },
      },
    });
    return true;
  } catch (err) {
    console.error('[FCM] sendPushToUser failed:', err);
    return false;
  }
}

export async function sendPushToMultiple(
  userIds: string[],
  message: PushMessage,
): Promise<{ sent: number; failed: number }> {
  // FCM batch limit = 500 tokens
  const results = await Promise.allSettled(userIds.map((id) => sendPushToUser(id, message)));
  const sent   = results.filter((r) => r.status === 'fulfilled' && r.value).length;
  const failed = results.length - sent;
  return { sent, failed };
}

export async function subscribeToTopic(token: string, topic: string): Promise<void> {
  try {
    await getFcmAdmin().subscribeToTopic([token], topic);
  } catch (err) {
    console.error('[FCM] subscribeToTopic failed:', err);
  }
}

export async function sendPushToTopic(topic: string, message: PushMessage): Promise<void> {
  try {
    await getFcmAdmin().send({
      topic,
      notification: { title: message.title, body: message.body },
      data: message.data,
    });
  } catch (err) {
    console.error('[FCM] sendPushToTopic failed:', err);
  }
}
