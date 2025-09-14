
import * as admin from 'firebase-admin';

// This function ensures that Firebase Admin is initialized only once.
export function getFirebaseAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }
  return admin;
}
