
'use server';

import { auth } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import admin from '@/lib/firebase-admin';
import { doc, updateDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

interface VerificationData {
    realName: string;
    idNumber: string;
    idPhotoPath: string;
}

// Helper function to get the public URL of a file from GCS
function getPublicUrl(bucketName: string, filePath: string) {
    return `https://storage.googleapis.com/${bucketName}/${filePath}`;
}


export async function getSignedUploadUrl(fileType: string, fileName: string) {
    // This action is now deprecated in favor of server-side uploads to avoid CORS issues.
    // Kept here to avoid breaking other parts of the app if they use it, but should be refactored.
    const filePath = `user-documents/banners/${Date.now()}-${fileName}`;
    const bucket = admin.storage().bucket();
    const file = bucket.file(filePath);
    
    const options = {
        version: 'v4' as const,
        action: 'write' as const,
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType: fileType,
    };

    try {
        const [url] = await file.getSignedUrl(options);
        return { url, filePath };
    } catch (error) {
        console.error('Error getting signed URL', error);
        throw new Error('No se pudo generar la URL de subida.');
    }
}


export async function updateUserVerification(data: VerificationData) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error('Debes iniciar sesión para actualizar tu perfil.');
    }

    const userDocRef = doc(db, 'users', currentUser.uid);

    try {
        const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
        if (!bucketName) {
            throw new Error('La configuración del bucket de almacenamiento no está definida.');
        }

        const idPhotoUrl = getPublicUrl(bucketName, data.idPhotoPath);

        await updateDoc(userDocRef, {
            realName: data.realName,
            idNumber: data.idNumber,
            idPhotoUrl: idPhotoUrl,
            verificationStatus: 'pending'
        });
        
        revalidatePath('/wallet'); // Revalidate the wallet page to show new status
        return { success: true };

    } catch (error) {
        console.error('Error updating user verification', error);
        throw new Error('No se pudo actualizar la información de verificación.');
    }
}
