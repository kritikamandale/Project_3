import admin from 'firebase-admin';

function getApp(): admin.app.App {
  if (admin.apps.length) return admin.apps[0]!;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY env var is not set');
  }

  const serviceAccount = JSON.parse(
    Buffer.from(serviceAccountJson, 'base64').toString('utf-8'),
  ) as admin.ServiceAccount;

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

// Lazy-init so Next.js module evaluation doesn't crash if env vars aren't set
let _fcm: admin.messaging.Messaging | null = null;
let _firestore: admin.firestore.Firestore | null = null;

export function getFcmAdmin(): admin.messaging.Messaging {
  if (!_fcm) _fcm = getApp().messaging();
  return _fcm;
}

export function getFirestoreAdmin(): admin.firestore.Firestore {
  if (!_firestore) _firestore = getApp().firestore();
  return _firestore;
}

// Convenience re-exports (backward compat)
export const fcmAdmin       = { get messaging() { return getFcmAdmin(); } };
export const firestoreAdmin = { get firestore() { return getFirestoreAdmin(); } };
