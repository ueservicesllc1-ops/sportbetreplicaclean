
import * as admin from 'firebase-admin';
import { getApps, cert } from "firebase-admin/app";

// This function ensures that Firebase Admin is initialized only once.
export function getFirebaseAdmin() {
  if (!getApps().length) {
    const firebaseAdminConfig = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    };
    
    try {
      admin.initializeApp({
        credential: cert(firebaseAdminConfig),
        storageBucket: 'studio-3302383355-1ea39.appspot.com',
      });
    } catch (error) {
      console.error('Firebase admin initialization error', error);
    }
  }
  return admin;
}
