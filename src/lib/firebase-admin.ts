import * as admin from 'firebase-admin';
import { getApplicationDefault } from 'firebase-admin/app';

// Check if the app is already initialized to prevent errors
if (!admin.apps.length) {
    admin.initializeApp({
        credential: getApplicationDefault(),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
}

export default admin;
