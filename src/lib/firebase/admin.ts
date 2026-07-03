import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import type { ServiceAccount } from 'firebase-admin/app';

function getAdminApp() {
  if (getApps().length) return getApp();

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY env var is not set');
  }

  const serviceAccount = JSON.parse(
    Buffer.from(serviceAccountJson, 'base64').toString('utf-8'),
  ) as ServiceAccount;

  return initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

let _fcm: Messaging | null = null;
let _firestore: Firestore | null = null;

export function getFcmAdmin(): Messaging {
  if (!_fcm) _fcm = getMessaging(getAdminApp());
  return _fcm;
}

export function getFirestoreAdmin(): Firestore {
  if (!_firestore) _firestore = getFirestore(getAdminApp());
  return _firestore;
}

export const fcmAdmin       = { get messaging() { return getFcmAdmin(); } };
export const firestoreAdmin = { get firestore() { return getFirestoreAdmin(); } };
