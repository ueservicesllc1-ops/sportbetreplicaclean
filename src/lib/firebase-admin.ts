
import * as admin from 'firebase-admin';

// This function ensures that Firebase Admin is initialized only once.
export function getFirebaseAdmin() {
  if (!admin.apps.length) {
    const serviceAccountKey = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (serviceAccountKey) {
        try {
            // If the env var contains the JSON string, parse it.
            const serviceAccount = JSON.parse(serviceAccountKey);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            });
        } catch (e) {
            console.error('Failed to parse GOOGLE_APPLICATION_CREDENTIALS:', e);
            // Fallback for environments where it's a file path (not this one)
            // or for default ADC.
            admin.initializeApp({
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            });
        }
    } else {
        // Initialize with default credentials if the env var is not set.
        admin.initializeApp({
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
    }
  }
  return admin;
}
